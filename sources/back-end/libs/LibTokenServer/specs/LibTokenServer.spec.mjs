import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import got from 'got';
import {
  nanoid,
} from 'nanoid';
import {
  LibTokenServer,
} from '../LibTokenServer.mjs';

const debuglog = util.debuglog(`${LibTokenServer.name}:specs`);
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

describe(LibTokenServer.constructor.name, () => {
  const LibTokenServerConfig = Object.freeze({
    token: {
      ctx: nanoid(8), // ctx must always by 8 characters long
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
      ttl: {
        accessToken: 500,
      },
    },
    uws: {
      port: 9090,
    },
  });
  let libTokenServer = null;
  let client = null;

  before(async () => {
    libTokenServer = new LibTokenServer(LibTokenServerConfig);

    await libTokenServer.start();

    expect(libTokenServer).to.exist;

    client = got.extend({
      prefixUrl: `http://localhost:${LibTokenServerConfig.uws.port}`,
    });
  });

  after(async () => {
    await libTokenServer.stop();

    libTokenServer = null;
    client = null;
  });

  it.only('should issueAccountToken', async () => {
    const { body } = await client('account-token', {});
    const message = JSON.parse(body);

    debuglog('message:', message);

    expect(message.token.length > 0).to.be.true;
  });

  // FIXME: remove this when all tests are ready
});
