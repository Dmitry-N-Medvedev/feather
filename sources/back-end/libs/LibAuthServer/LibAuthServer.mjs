import util from 'util';
import uWS from 'uWebSockets.js';
import libmacaroons from 'macaroons.js';
import {
  verifyAccessToken,
} from '@dmitry-n-medvedev/libtoken/verifiers/verifyAccessToken.mjs';
import {
  ActionTypes,
} from '@dmitry-n-medvedev/libtoken/constants/ActionTypes.mjs';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  retrieveAccessTokenInfoByIdentifier,
} from '@dmitry-n-medvedev/libcommon/helpers/redis/retrieveAccessTokenInfoByIdentifier.mjs';
import {
  BufferToStringEncoding,
} from '@dmitry-n-medvedev/libcommon/constants/BufferToStringEncoding.mjs';

const OK_STATUS = '200 OK';
const UNAUTHORIZED_STATUS = '401 Unauthorized';
// const NOT_READY_STATUS = '503 Service Unavailable';
const BAD_REQUEST_STATUS_CODE = 400;
const ALL_NET_INTERFACES = '0.0.0.0';

export class LibAuthServer {
  #debuglog = null;
  #config = null;
  #server = null;
  #handle = null;
  #macaroonsBuilder = null;
  #libRedisAdapter = null;
  #redisInstanceReader = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#debuglog = util.debuglog(this.constructor.name);

    this.#config = Object.freeze({ ...config });
    this.#debuglog('config:', this.#config);

    this.#macaroonsBuilder = libmacaroons.MacaroonsBuilder;

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
  }

  async start() {
    if (this.#handle !== null) {
      return Promise.resolve();
    }

    this.#libRedisAdapter = new LibRedisAdapter();
    this.#redisInstanceReader = await this.#libRedisAdapter.newInstance(this.#config.redis, null);
    this.#redisInstanceReader.on('connected', () => {
      this.#debuglog('redisInstanceReader.connected');
    });

    this.#server = uWS
      .App({})
      .get('/*', async (res, req) => {
        res.onAborted(() => {
          res.aborted = true;
        });

        res.aborted = false;

        this.#debuglog(this.#redisInstanceReader);

        try {
          const authorizationHeader = req.getHeader('authorization') ?? 'N/A';
          this.#debuglog('.get.authorizationHeader:', authorizationHeader);

          const xOriginalUri = req.getHeader('x-original-uri') ?? 'N/A';
          this.#debuglog('.get.xOriginalUri:', xOriginalUri);

          const url = req.getUrl();
          this.#debuglog('.get.url:', url);

          const deserializedAccessToken = this.#macaroonsBuilder.deserialize(authorizationHeader);
          this.#debuglog('.get.deserializedAccessToken:', deserializedAccessToken);

          const {
            identifier,
          } = deserializedAccessToken;
          this.#debuglog('.get.identifier:', identifier);

          const [uid, secretKey] = await retrieveAccessTokenInfoByIdentifier(identifier, this.#redisInstanceReader);
          this.#debuglog('.get.retrieveAccessTokenInfoByIdentifier:', uid, secretKey);

          const actionType = ActionTypes.READ;
          const actionObject = xOriginalUri;

          const isTokenValid = verifyAccessToken(
            libmacaroons, deserializedAccessToken, uid, Buffer.from(secretKey, BufferToStringEncoding), actionType, actionObject,
          );
          this.#debuglog('.get.isTokenValid:', isTokenValid);

          const status = isTokenValid === true ? OK_STATUS : UNAUTHORIZED_STATUS;
          this.#debuglog('.get.status:', status);

          res.writeStatus(status);

          if (res.aborted === false) {
            return res.end();
          }
        } catch (error) {
          this.#debuglog(error);

          res.writeStatus(BAD_REQUEST_STATUS_CODE).end(error.message || 'Bad Request');
        }

        return this;
      })
      .get('/health-check', (res) => {
        this.#debuglog('/health-check');

        res.writeStatus(OK_STATUS);

        return res.end();
      })
      .listen(ALL_NET_INTERFACES, this.#config.port, (handle) => {
        this.#debuglog('.listen', ALL_NET_INTERFACES, this.#config.port, handle);

        if (!handle) {
          throw new Error(`failed to listen on port ${this.#config.port}`);
        }

        this.#handle = handle;

        this.#debuglog(`started on port ${this.#config.port}`);
      });

    return Promise.resolve();
  }

  async stop() {
    this.#debuglog('.stop');

    if (this.#handle === null) {
      return Promise.resolve();
    }

    uWS.us_listen_socket_close(this.#handle);

    this.#debuglog(`stopped listening on port: ${this.#config.port}`);

    this.#libRedisAdapter.shutDownInstance(this.#redisInstanceReader);
    this.#libRedisAdapter = null;
    this.#redisInstanceReader = null;
    this.#handle = null;
    this.#server = null;
    this.#macaroonsBuilder = null;
    this.#debuglog = null;
    this.#config = null;

    return Promise.resolve();
  }
}
