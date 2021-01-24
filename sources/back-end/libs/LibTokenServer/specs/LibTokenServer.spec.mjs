import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import got from 'got';
import {
  nanoid,
} from 'nanoid';
import {
  ActionTypes,
} from '@dmitry-n-medvedev/libtoken/constants/ActionTypes.mjs';
import {
  Locations,
} from '@dmitry-n-medvedev/libcommon/constants/Locations.mjs';
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
      http2: true,
      throwHttpErrors: false,
    });
  });

  after(async () => {
    await libTokenServer.stop();

    libTokenServer = null;
    client = null;
  });

  it('should obtain Account and Access tokens', async () => {
    const forAction = Object.freeze({
      type: ActionTypes.READ,
      object: `/${nanoid(5)}.${nanoid(3)}`,
    });
    const obtainAccountToken = async () => {
      const {
        body,
      } = await client('account-token', {});
      return (JSON.parse(body)).token;
    };
    const obtainAccessToken = async (action, accountToken) => {
      const {
        body,
      } = await client.post('access-token', {
        headers: {
          Authorization: accountToken,
        },
        body: JSON.stringify({
          action: forAction,
          location: Locations.FILE_SERVER,
        }),
      });

      return JSON.parse(body).token;
    };

    const accountToken = await obtainAccountToken();
    const accessToken = await obtainAccessToken(forAction, accountToken);

    expect(accessToken.length > 0).to.be.true;
  });

  // FIXME: remove this when all tests are ready
});
