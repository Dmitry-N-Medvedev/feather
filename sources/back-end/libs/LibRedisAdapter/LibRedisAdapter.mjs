import util from 'util';
import EventEmitter from 'events';
import Redis from 'redis-fast-driver';
import {
  nanoid,
} from 'nanoid';

const debuglog = util.debuglog('LibRedisAdapter');
const SYMBOL_NAME = 'feather';
const DEFAULT_REDIS_CONFIG = Object.freeze({
  autoConnect: false,
  doNotSetClientName: true,
  doNotRunQuitOnEnd: false,
  tryToReconnect: false,
  reconnectTimeout: 0,
  maxRetries: 0,
});

const eventPromise = (eventName, redisInstance) => new Promise((resolve) => {
  try {
    redisInstance.once(eventName, resolve);
  } catch (redisError) {
    debuglog(redisError);
  }
});

const connectToRedis = async (redisInstance = null) => {
  debuglog('connectToRedis');

  if (redisInstance === null) {
    throw new ReferenceError('redisInstance is undefined');
  }

  try {
    redisInstance.connect();

    await Promise.all([
      eventPromise('ready', redisInstance),
      eventPromise('connect', redisInstance),
    ]);
  } catch (redisError) {
    debuglog(redisError.message);
  }
};

const disconnectFromRedis = (redisInstance = null) => {
  if (redisInstance === null) {
    throw new ReferenceError('redisInstance is undefined');
  }

  try {
    redisInstance.end();

    return eventPromise('end', redisInstance);
  } catch (redisError) {
    debuglog(redisError);

    throw redisError;
  }
};

export class LibRedisAdapter extends EventEmitter {
  #instances = null;

  constructor() {
    super();

    this.#instances = new Map();
  }

  async destroy() {
    for await (const redisInstance of this.#instances) {
      try {
        debuglog(`shutting down ${redisInstance[Symbol.for(SYMBOL_NAME)].id} redis instance`);

        await this.shutDownInstance(redisInstance);
      } catch (anyError) {
        debuglog(anyError.message);
      }
    }

    this.#instances = null;
  }

  // eslint-disable-next-line func-names
  #handleInstanceReady () {
    debuglog('handleInstanceReady');
  }

  // eslint-disable-next-line func-names
  #handleInstanceConnected (redisInstance, clientName) {
    debuglog('handleInstanceConnected');

    redisInstance.rawCallAsync(['CLIENT', 'SETNAME', clientName]);

    this.emit('connected');
  }

  // eslint-disable-next-line func-names
  #handleInstanceDisconnected () {
    debuglog('handleInstanceDisconnected');
  }

  // eslint-disable-next-line func-names
  #handleInstanceReconnecting () {
    debuglog('handleInstanceReconnecting');
  }

  // eslint-disable-next-line func-names
  #handleInstanceError (error) {
    debuglog('handleInstanceError:', error.message);

    throw error;
  }

  // eslint-disable-next-line func-names
  #handleInstanceEnd () {
    debuglog('handleInstanceEnd');
  }

  #initRedisInstanceHandlers = (redisInstance = null, clientName) => {
    redisInstance.addListener('ready', this.#handleInstanceReady, { once: true });
    redisInstance.on('connect', () => {
      this.#handleInstanceConnected(redisInstance, clientName);
    }, { once: true });
    redisInstance.addListener('disconnect', this.#handleInstanceDisconnected, { once: true });
    redisInstance.addListener('reconnecting', this.#handleInstanceReconnecting, { once: true });
    redisInstance.addListener('error', this.#handleInstanceError, { once: true });
    redisInstance.addListener('end', () => {
      this.shutDownInstance(redisInstance);
    }, { once: true });
  }

  async newInstance(config = null, clientName = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    if (Object.keys(config).length === 0) {
      throw new TypeError('config is empty');
    }

    if (clientName === null) {
      clientName = nanoid(5);
    }

    try {
      const connectionConfig = Object.freeze({
        ...config,
        ...DEFAULT_REDIS_CONFIG,
      });

      debuglog('new Redis:', JSON.stringify(connectionConfig, null, 2));

      const redisInstance = new Redis(connectionConfig);

      this.#initRedisInstanceHandlers(redisInstance, clientName);

      await connectToRedis(redisInstance);

      redisInstance[Symbol.for(SYMBOL_NAME)] = Object.freeze({
        id: nanoid(8),
      });

      this.#instances.set((redisInstance[Symbol.for(SYMBOL_NAME)]).id, redisInstance);

      return redisInstance;
    } catch (redisError) {
      debuglog(redisError);

      throw redisError;
    }
  }

  async shutDownInstance(redisInstance = null) {
    if (redisInstance === null) {
      throw new ReferenceError('redisInstance is undefined');
    }

    if (this.#instances.delete(redisInstance[Symbol.for(SYMBOL_NAME)].id) === false) {
      throw new ReferenceError('no redis instance found for the given instanceId');
    }

    try {
      disconnectFromRedis(redisInstance);
    } catch (redisError) {
      debuglog(redisError.message);
    }
  }
}
