import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import got from 'got';
import {
  nanoid,
} from 'nanoid';
import {
  LibTokenFactory,
} from '@dmitry-n-medvedev/libtokenfactory/LibTokenFactory.mjs';
import {
  ActionTypes,
} from '@dmitry-n-medvedev/libtoken/constants/ActionTypes.mjs';
import {
  Locations,
} from '@dmitry-n-medvedev/libcommon/constants/Locations.mjs';
import {
  LibAuthServer,
} from '../LibAuthServer.mjs';

const debuglog = util.debuglog('LibAuthServer:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibAuthServer', () => {
  const LibTokenFactoryConfig = Object.freeze({
    ctx: nanoid(8), // ctx must always by 8 characters long
    redis: {
      host: '127.0.0.1',
      port: 6379,
    },
    ttl: {
      accessToken: 500,
    },
  });
  const LibAuthServerConfig = Object.freeze({
    port: 9090,
    redis: LibTokenFactoryConfig.redis,
  });
  let libTokenFactory = null;
  let libAuthServer = null;
  let client = null;
  let accountToken = null;

  before(async () => {
    libTokenFactory = new LibTokenFactory(LibTokenFactoryConfig);
    await libTokenFactory.start();
    accountToken = await libTokenFactory.issueAccountToken();

    libAuthServer = new LibAuthServer(LibAuthServerConfig);

    await libAuthServer.start();

    client = got.extend({
      prefixUrl: `http://localhost:${LibAuthServerConfig.port}`,
    });
  });

  after(async () => {
    client = null;

    await libAuthServer.stop();
    libAuthServer = null;

    await libTokenFactory.stop();
    libTokenFactory = null;
    accountToken = null;
  });

  it.only('should issue a GET request w/ an AccessToken', async () => {
    const filePath = `${nanoid(16)}.${nanoid(3)}`;
    const forAction = Object.freeze({
      type: ActionTypes.READ,
      object: `/questionnaires/${filePath}`,
    });
    const accessToken = await libTokenFactory.issueAccessToken(forAction, accountToken, Locations.FILE_SERVER);
    const response = await client(`questionnaires/${filePath}`, {
      headers: {
        Authorization: accessToken,
      },
    });

    expect(response.statusCode).to.equal(200);
  });
});
