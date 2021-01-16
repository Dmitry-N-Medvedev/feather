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

    this.#server = uWS
      .App({})
      .get('/*', async (res, req) => {
        res.onAborted(() => {
          res.aborted = true;
        });

        res.aborted = false;

        const authorizationHeader = req.getHeader('authorization') ?? 'N/A';
        const url = req.getUrl();
        const deserializedAccessToken = this.#macaroonsBuilder.deserialize(authorizationHeader);
        const {
          identifier,
        } = deserializedAccessToken;
        const [uid, secretKey] = await retrieveAccessTokenInfoByIdentifier(identifier, this.#redisInstanceReader);
        const actionType = ActionTypes.READ;
        const actionObject = url;

        const isTokenValid = verifyAccessToken(
          libmacaroons, deserializedAccessToken, uid, Buffer.from(secretKey, BufferToStringEncoding), actionType, actionObject,
        );
        const status = isTokenValid === true ? OK_STATUS : UNAUTHORIZED_STATUS;

        res.writeStatus(status);

        if (res.aborted === false) {
          return res.end();
        }

        return this;
      })
      .listen(this.#config.port, (handle) => {
        if (!handle) {
          throw new Error(`failed to listen on port ${this.#config.port}`);
        }

        this.#handle = handle;

        this.#debuglog(`started on port ${this.#config.port}`);
      });

    return Promise.resolve();
  }

  async stop() {
    if (this.#handle === null) {
      return Promise.resolve();
    }

    uWS.us_listen_socket_close(this.#handle);
    this.#libRedisAdapter.shutDownInstance(this.#redisInstanceReader);
    this.#libRedisAdapter = null;
    this.#redisInstanceReader = null;
    this.#handle = null;
    this.#debuglog = null;
    this.#server = null;
    this.#config = null;
    this.#macaroonsBuilder = null;

    this.#debuglog(`stopped listening on port: ${this.#config.port}`);

    return Promise.resolve();
  }
}
