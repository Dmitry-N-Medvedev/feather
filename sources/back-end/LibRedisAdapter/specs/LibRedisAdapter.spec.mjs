import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
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
  const LibRedisAdapterConfig = Object.freeze({
    host: '127.0.0.1',
    port: 6379,
  });

  before(async () => {
    libRedisAdapter = new LibRedisAdapter();
  });

  after(async () => libRedisAdapter.destroy());

  it.only('should newInstance and shutDownInstance', async () => {
    const redisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig);

    expect(redisInstance).to.exist;
    expect(redisInstance.ready).to.be.true;

    libRedisAdapter.shutDownInstance(redisInstance);

    expect(redisInstance.destroyed).to.be.true;
  });
});
