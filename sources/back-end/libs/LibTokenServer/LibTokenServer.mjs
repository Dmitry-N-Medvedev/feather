import util from 'util';
import uWS from 'uWebSockets.js';
import {
  LibTokenFactory,
} from '@dmitry-n-medvedev/libtokenfactory/LibTokenFactory.mjs';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  handleGetAccountToken,
} from './handlers/handleGetAccountToken.mjs';
import {
  handleGetAccessToken,
} from './handlers/handleGetAccessToken.mjs';

const ALL_NET_INTERFACES = '0.0.0.0';

export class LibTokenServer {
  #debuglog = null;
  #config = null;
  #libRedisAdapter = null;
  #libTokenFactory = null;
  #redisInstance = null;
  #handle = null;
  #server = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#config = Object.freeze({ ...config });
    this.#debuglog = util.debuglog(this.constructor.name);
  }

  async start() {
    if (this.#handle !== null) {
      return Promise.resolve();
    }

    this.#libRedisAdapter = new LibRedisAdapter();
    this.#libTokenFactory = new LibTokenFactory(this.#config.token, this.#libRedisAdapter);

    await this.#libTokenFactory.start();

    this.#redisInstance = await this.#libRedisAdapter.newInstance(this.#config.token.redis, this.constructor.name);
    this.#redisInstance.once('connected', () => {
      this.#debuglog('redisInstance.connected');
    });

    this.#server = uWS
      .App({})
      .get('/account-token', async (res) => handleGetAccountToken(res, this.#libTokenFactory, this.#debuglog))
      .post('/access-token', async (res, req) => handleGetAccessToken(res, req, this.#libTokenFactory, this.#debuglog))
      .listen(ALL_NET_INTERFACES, this.#config.uws.port, (handle) => {
        this.#debuglog('.listen', ALL_NET_INTERFACES, this.#config.uws.port, handle);

        if (!handle) {
          throw new Error(`failed to listen on port ${this.#config.uws.port}`);
        }

        this.#handle = handle;

        this.#debuglog(`started on port ${this.#config.uws.port}`);
      });

    return undefined;
  }

  // FIXME: not complete
  async stop() {
    await this.#libTokenFactory.stop();
    await this.#libRedisAdapter.destroy();

    return undefined;
  }
}
