import util from 'util';
import _sodium from 'libsodium-wrappers';
import macaroons from 'macaroons.js';
import {
  createRandomString,
} from '@dmitry-n-medvedev/libtoken/createRandomString.mjs';
import {
  deriveSubKey,
} from '@dmitry-n-medvedev/libtoken/helpers/deriveSubKey.mjs';
import {
  createAccountToken,
} from '@dmitry-n-medvedev/libtoken/createAccountToken.mjs';
import {
  createAccessToken,
} from '@dmitry-n-medvedev/libtoken//createAccessToken.mjs';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  RedisTokenTypes,
} from './constants/RedisTokenTypes.mjs';
import {
  RedisAccountTokenFields,
} from './constants/RedisAccountTokenFields.mjs';
import {
  RedisAccessTokenFields,
} from './constants/RedisAccessTokenFields.mjs';
import {
  RedisAccountTokenFlags,
} from './constants/RedisAccountTokenFlags.mjs';

export class LibTokenServer {
  #libsodium = null;
  #config = null;
  #masterKey = null;
  #ctx = null;
  #isRunning = false;
  #macaroonsBuilder = null;
  #libRedisAdapter = null;
  #redisInstanceWriter = null;
  #debuglog = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#debuglog = util.debuglog('LibTokenServer');

    this.#config = Object.freeze({ ...config });
    this.#libRedisAdapter = new LibRedisAdapter();
  }

  async start() {
    if (this.#isRunning === true) {
      return Promise.resolve();
    }

    await _sodium.ready;

    this.#libsodium = _sodium;
    this.#masterKey = this.#libsodium.crypto_kdf_keygen(this.#libsodium.Uint8ArrayOutputFormat);
    this.#macaroonsBuilder = macaroons.MacaroonsBuilder;
    this.#redisInstanceWriter = await this.#libRedisAdapter.newInstance(this.#config.redis, null);
    this.#isRunning = true;

    return Promise.resolve();
  }

  async stop() {
    if (this.#isRunning === false) {
      return Promise.resolve();
    }

    this.#masterKey = null;
    this.#libsodium = null;
    this.#config = null;
    this.#macaroonsBuilder = null;
    this.#isRunning = false;
    this.#libRedisAdapter.shutDownInstance(this.#redisInstanceWriter);
    await this.#libRedisAdapter.destroy();
    this.#redisInstanceWriter = null;

    return Promise.resolve();
  }

  // eslint-disable-next-line class-methods-use-this
  async issueAccountToken() {
    const identifier = `${RedisTokenTypes.ACCOUNT_TOKEN}:${createRandomString(this.#libsodium)}`;
    const uid = createRandomString(this.#libsodium);
    const secretKey = deriveSubKey(this.#libsodium, this.#config.ctx, this.#masterKey);
    const tokenSettings = {
      location: this.#config.locations['https://feather-insurance.com/'],
      secretKey,
      identifier,
      uid,
    };
    const FLAGS = 0 | RedisAccountTokenFlags.IS_OK;

    return (await Promise.all([
      this.#redisInstanceWriter.rawCallAsync([
        'HMSET',
        identifier,
        RedisAccountTokenFields.USER_ID,
        uid,
        RedisAccountTokenFields.SECRET_KEY,
        secretKey,
        RedisAccountTokenFields.FLAGS,
        FLAGS,
      ]),
      createAccountToken(this.#macaroonsBuilder, tokenSettings),
    ]))[1] ?? null;
  }

  async issueAccessToken(forAction = null, serializedAccountToken = null) {
    if (forAction === null) {
      throw new ReferenceError('forAction is undefined');
    }

    if (serializedAccountToken === null) {
      throw new ReferenceError('serializedAccountToken is undefined');
    }

    const { identifier } = this.#macaroonsBuilder.deserialize(serializedAccountToken);

    const uid = await this.#redisInstanceWriter.rawCallAsync(['HGET', identifier, RedisAccountTokenFields.USER_ID]);
    const accessTokenIdentifier = `${RedisTokenTypes.ACCESS_TOKEN}:${createRandomString(this.#libsodium)}`;
    const secretKey = deriveSubKey(this.#libsodium, this.#config.ctx, this.#masterKey);
    const tokenSettings = {
      location: this.#config.locations['https://file-server.feather-insurance.com/'],
      secretKey,
      identifier: accessTokenIdentifier,
      uid,
    };
    const ttl = Object.freeze({
      from: Date.now(),
      upto: Date.now() + this.#config.ttl.accessToken,
    });

    return (await Promise.all([
      async () => {
        await this.#redisInstanceWriter.rawCallAsync(['MULTI']);
        await this.#redisInstanceWriter.rawCallAsync([
          'HMSET',
          accessTokenIdentifier,
          RedisAccessTokenFields.USER_ID,
          uid,
          RedisAccessTokenFields.SECRET_KEY,
          secretKey,
        ]);
        await this.#redisInstanceWriter.rawCallAsync(['PEXPIRE', identifier, (this.#config.ttl.accessToken * 2)]);
        return this.#redisInstanceWriter.rawCallAsync(['EXEC']);
      },
      createAccessToken(this.#macaroonsBuilder, tokenSettings, ttl, forAction),
    ]))[1] ?? null;
  }
}
