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

  const AUTHENTICATION_OK = 200;
  const AUTHENTICATION_ER = 401;
  const HEALTH_CHECK_OK = AUTHENTICATION_OK;

  before(async () => {
    try {
      libTokenFactory = new LibTokenFactory(LibTokenFactoryConfig);
      await libTokenFactory.start();
      accountToken = await libTokenFactory.issueAccountToken();

      libAuthServer = new LibAuthServer(LibAuthServerConfig);
      await libAuthServer.start();

      client = got.extend({
        prefixUrl: `http://localhost:${LibAuthServerConfig.port}`,
      });
    } catch (error) {
      debuglog(error);
    }

    return Promise.resolve();
  });

  after(async () => {
    try {
      client = null;

      if (libAuthServer !== null) {
        await libAuthServer.stop();

        libAuthServer = null;
      }

      if (libTokenFactory !== null) {
        await libTokenFactory.stop();
        libTokenFactory = null;
      }
      accountToken = null;
    } catch (error) {
      debuglog(error);
    }
  });

  it('should succeed to authenticate a GET request', async () => {
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

    expect(response.statusCode).to.equal(AUTHENTICATION_OK);
  });

  it('should fail to authenticate a GET request', async () => {
    const objectPath_In_ForAction = `/questionnaires/${nanoid(16)}.${nanoid(3)}`;
    const objectPath_In_Request = `questionnaires/${nanoid(16)}.${nanoid(3)}`;
    const forAction = Object.freeze({
      type: ActionTypes.READ,
      object: objectPath_In_ForAction,
    });

    expect(objectPath_In_ForAction).to.not.equal(objectPath_In_Request);

    const accessToken = await libTokenFactory.issueAccessToken(forAction, accountToken, Locations.FILE_SERVER);

    const response = await client(objectPath_In_Request, {
      headers: {
        Authorization: accessToken,
      },
      throwHttpErrors: false,
    });

    expect(response.statusCode).to.equal(AUTHENTICATION_ER);
  });

  it('should do /health-check', async () => {
    let statusCode = null;

    try {
      const response = await client('health-check', {
        throwHttpErrors: false,
      });

      statusCode = response.statusCode;
    } catch (healthCheckError) {
      debuglog(healthCheckError);
    } finally {
      expect(statusCode).to.equal(HEALTH_CHECK_OK);
    }
  });
});
