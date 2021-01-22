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
} from '@dmitry-n-medvedev/libtoken/createAccessToken.mjs';
import {
  Locations,
} from '@dmitry-n-medvedev/libcommon/constants/Locations.mjs';
import {
  RedisTokenTypes,
} from '@dmitry-n-medvedev/libcommon/constants/RedisTokenTypes.mjs';
import {
  RedisAccountTokenFields,
} from '@dmitry-n-medvedev/libcommon/constants/RedisAccountTokenFields.mjs';
import {
  RedisAccessTokenFields,
} from '@dmitry-n-medvedev/libcommon/constants/RedisAccessTokenFields.mjs';
import {
  RedisAccountTokenFlags,
} from '@dmitry-n-medvedev/libcommon/constants/RedisAccountTokenFlags.mjs';
import {
  resolveUidByAccountTokenIdentifier,
} from '@dmitry-n-medvedev/libcommon/helpers/redis/resolveUidByAccountTokenIdentifier.mjs';
import {
  BufferToStringEncoding,
} from '@dmitry-n-medvedev/libcommon/constants/BufferToStringEncoding.mjs';
import {
  resolveTokenIdentifierName,
} from './helpers/resolveTokenIdentifierName.mjs';
import {
  validateAction,
} from './authz/validateAction.mjs';

export class LibTokenFactory {
  #libsodium = null;
  #config = null;
  #masterKey = null;
  #ctx = null;
  #isRunning = false;
  #macaroonsBuilder = null;
  #libRedisAdapter = null;
  #redisInstanceWriter = null;
  #debuglog = null;

  constructor(config = null, libRedisAdapter = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    if (libRedisAdapter === null) {
      throw new ReferenceError('libRedisAdapter is undefined');
    }

    this.#debuglog = util.debuglog(this.constructor.name);

    this.#config = Object.freeze({ ...config });
    this.#libRedisAdapter = libRedisAdapter;
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
    const identifier = resolveTokenIdentifierName(RedisTokenTypes.ACCOUNT_TOKEN, createRandomString(this.#libsodium));
    const uid = createRandomString(this.#libsodium);
    const secretKey = deriveSubKey(this.#libsodium, this.#config.ctx, this.#masterKey);
    const tokenSettings = {
      location: Locations.TOKEN_SERVER,
      secretKey,
      identifier,
      uid,
    };
    const FLAGS = 0 | RedisAccountTokenFlags.IS_OK;

    if (this.#redisInstanceWriter.ready === false) {
      return Promise.resolve(null);
    }

    return (await Promise.all([
      this.#redisInstanceWriter.rawCallAsync([
        'HSET',
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

  // eslint-disable-next-line func-names
  async #saveAccessToken (accessTokenIdentifier = null, uid = null, secretKey = null) {
    if (accessTokenIdentifier === null) {
      throw new ReferenceError('accessTokenIdentifier is undefined');
    }

    if (uid === null) {
      throw new ReferenceError('uid is undefined');
    }

    if (secretKey === null) {
      throw new ReferenceError('secretKey is undefined');
    }

    await this.#redisInstanceWriter.rawCallAsync(['MULTI']);
    await this.#redisInstanceWriter.rawCallAsync([
      'HSET',
      accessTokenIdentifier,
      RedisAccessTokenFields.USER_ID.toString(),
      uid,
      RedisAccessTokenFields.SECRET_KEY.toString(),
      Buffer.from(secretKey).toString(BufferToStringEncoding),
    ]);
    await this.#redisInstanceWriter.rawCallAsync(['PEXPIRE', accessTokenIdentifier, (this.#config.ttl.accessToken * 2)]);
    return this.#redisInstanceWriter.rawCallAsync(['EXEC']);
  }

  async issueAccessToken(forAction = null, serializedAccountToken = null, location = null) {
    if (forAction === null) {
      throw new ReferenceError('forAction is undefined');
    }

    if (serializedAccountToken === null) {
      throw new ReferenceError('serializedAccountToken is undefined');
    }

    const { identifier } = this.#macaroonsBuilder.deserialize(serializedAccountToken);

    const uid = await resolveUidByAccountTokenIdentifier(identifier, this.#redisInstanceWriter, RedisAccountTokenFields.USER_ID);

    const validatedAction = validateAction(uid, forAction);

    const accessTokenIdentifier = resolveTokenIdentifierName(RedisTokenTypes.ACCESS_TOKEN, createRandomString(this.#libsodium));
    const secretKey = deriveSubKey(this.#libsodium, this.#config.ctx, this.#masterKey);
    const tokenSettings = {
      location: (location ?? Locations.INVALID_LOCATION),
      secretKey,
      identifier: accessTokenIdentifier,
      uid,
    };
    const ttl = Object.freeze({
      from: Date.now(),
      upto: Date.now() + this.#config.ttl.accessToken,
    });

    return (await Promise.all([
      this.#saveAccessToken(accessTokenIdentifier, uid, secretKey),
      createAccessToken(this.#macaroonsBuilder, tokenSettings, ttl, validatedAction),
    ]))[1] ?? null;
  }
}
