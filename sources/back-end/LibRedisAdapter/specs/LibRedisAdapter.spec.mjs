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

  const LibRedisAdapterConfig = Object.freeze({
    host: '127.0.0.1',
    port: 6379,
  });

  before(async () => {
    libRedisAdapter = new LibRedisAdapter();

    specRedisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig, SpecRedisInstanceName);
  });

  after(async () => {
    libRedisAdapter.shutDownInstance(specRedisInstance);

    specRedisInstance = null;

    await libRedisAdapter.destroy();

    libRedisAdapter = null;
  });

  it.only('should newInstance and shutDownInstance', async () => {
    const redisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig, nanoid(5));

    expect(redisInstance).to.exist;
    expect(redisInstance.ready).to.be.true;

    libRedisAdapter.shutDownInstance(redisInstance);

    expect(redisInstance.destroyed).to.be.true;
  });
});
