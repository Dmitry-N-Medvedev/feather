import util from 'util';
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
});

const eventPromise = (eventName, redisInstance) => new Promise((resolve) => {
  try {
    redisInstance.once(eventName, resolve);
  } catch (redisError) {
    debuglog(redisError);

    throw redisError;
  }
});

const connectToRedis = (redisInstance = null) => {
  if (redisInstance === null) {
    throw new ReferenceError('redisInstance is undefined');
  }

  redisInstance.connect();

  return Promise.all([
    eventPromise('ready', redisInstance),
    eventPromise('connect', redisInstance),
  ]);
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

export class LibRedisAdapter {
  #instances = null;

  constructor() {
    this.#instances = new Map();
  }

  async destroy() {
    for await (const redisInstance of this.#instances) {
      try {
        debuglog(`shutting down ${redisInstance[Symbol.for(SYMBOL_NAME)]} redis instance`);

        await this.shutDownInstance(redisInstance);
      } catch (anyError) {
        debuglog(anyError.message);
      }
    }

    this.#instances = null;
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

    const redisInstance = new Redis({
      ...config,
      ...DEFAULT_REDIS_CONFIG,
    });

    await connectToRedis(redisInstance);

    redisInstance[Symbol.for(SYMBOL_NAME)] = Object.freeze({
      id: nanoid(8),
    });

    await redisInstance.rawCallAsync(['CLIENT', 'SETNAME', clientName]);

    this.#instances.set((redisInstance[Symbol.for(SYMBOL_NAME)]).id, redisInstance);

    return redisInstance;
  }

  async shutDownInstance(redisInstance = null) {
    if (redisInstance === null) {
      throw new ReferenceError('redisInstance is undefined');
    }

    if (this.#instances.delete(redisInstance[Symbol.for(SYMBOL_NAME)].id) === false) {
      throw new ReferenceError('no redis instance found for the given instanceId');
    }

    await disconnectFromRedis(redisInstance);

    return Promise.resolve();
  }
}
