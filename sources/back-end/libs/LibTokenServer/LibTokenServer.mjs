import util from 'util';
import uWS from 'uWebSockets.js';
import {
  // eslint-disable-next-line no-unused-vars
  LibTokenFactory,
} from '@dmitry-n-medvedev/libtokenfactory/LibTokenFactory.mjs';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';

const ALL_NET_INTERFACES = '0.0.0.0';
const OK_STATUS = '200 OK';
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
      .get('/account-token', async (res) => {
        res.onAborted(() => {
          res.aborted = true;
        });

        res.aborted = false;

        if (res.aborted === false) {
          res.writeStatus(OK_STATUS).end(JSON.stringify({
            token: (await this.#libTokenFactory.issueAccountToken()),
          }));
        }
      })
      // .get('/access-token', (res, req) => {

      // })
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
