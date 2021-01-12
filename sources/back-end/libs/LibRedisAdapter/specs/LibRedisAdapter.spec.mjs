import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import {
  nanoid,
} from 'nanoid';
import {
  LibRedisAdapter,
} from '../LibRedisAdapter.mjs';

const debuglog = util.debuglog('specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibRedisAdapter', () => {
  let libRedisAdapter = null;
  let specRedisInstance = null;
  const SpecRedisInstanceName = 'SpecRedisInstance';
  const keysToCleanUp = [];

  const REDIS_OK_RESULT = 'OK';

  const LibRedisAdapterConfig = Object.freeze({
    host: '127.0.0.1',
    port: 6379,
  });

  const cleanUpData = async () => {
    if (keysToCleanUp.length > 0) {
      await specRedisInstance.rawCallAsync(['DEL', ...keysToCleanUp]);
    }
  };

  before(async () => {
    libRedisAdapter = new LibRedisAdapter();

    specRedisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig, SpecRedisInstanceName);
  });

  after(async () => {
    await cleanUpData();

    libRedisAdapter.shutDownInstance(specRedisInstance);

    specRedisInstance = null;

    await libRedisAdapter.destroy();

    libRedisAdapter = null;
  });

  it('should newInstance and shutDownInstance', async () => {
    const redisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig, nanoid(5));

    expect(redisInstance).to.exist;
    expect(redisInstance.ready).to.be.true;

    libRedisAdapter.shutDownInstance(redisInstance);

    expect(redisInstance.destroyed).to.be.true;
  });

  it('should store an Account Token data to Redis', async () => {
    const redisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig, nanoid(5));

    const identifier = `AT:${nanoid(64)}`;
    const uid = nanoid(32);
    const secretKey = nanoid(256);

    const FLAG_0 = 0x1;
    // eslint-disable-next-line no-unused-vars
    const FLAG_1 = 0x2;
    const FLAG_2 = 0x4;

    const FLAGS = FLAG_0 | FLAG_2;

    keysToCleanUp.push(identifier);

    const result = await redisInstance.rawCallAsync(['HMSET', identifier, 'UID', uid, 'SK', secretKey, 'FLAGS', FLAGS]);

    expect(result).to.equal(REDIS_OK_RESULT);

    const [retrievedSecretKey, retrievedFlags] = await redisInstance.rawCallAsync(['HMGET', identifier, 'SK', 'FLAGS']);

    expect(retrievedSecretKey).to.equal(secretKey);
    expect(retrievedFlags).to.equal(FLAGS.toString());

    const retrievedFlagsAsInt = parseInt(retrievedFlags, 16);

    expect(Boolean(retrievedFlagsAsInt & FLAG_0)).to.be.true; // FLAG_0 is set
    expect(Boolean(retrievedFlagsAsInt & FLAG_2)).to.be.true; // FLAG_2 is set

    libRedisAdapter.shutDownInstance(redisInstance);
  });
});
