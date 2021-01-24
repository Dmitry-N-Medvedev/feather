import util from 'util';
import dotenv from 'dotenv';
import execa from 'execa';
import which from 'which';
import got from 'got';
import {
  nanoid,
} from 'nanoid';
import mocha from 'mocha';
import chai from 'chai';
import {
  resolve,
} from 'path';
import {
  PassThrough,
} from 'stream';
import {
  ActionTypes,
} from '@dmitry-n-medvedev/libtoken/constants/ActionTypes.mjs';
import {
  Locations,
} from '@dmitry-n-medvedev/libcommon/constants/Locations.mjs';

import {
  startServer,
} from './helpers/startServer.mjs';
import {
  stopServer,
} from './helpers/stopServer.mjs';

const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;
const debuglog = util.debuglog('TokenServer:spec');

dotenv.config();

describe('Token Server', () => {
  let node = null;
  let file = null;
  let handle = null;
  const LibTokenServerConfig = Object.freeze({
    token: {
      ctx: process.env.CONTEXT, // ctx must always by 8 characters long
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
      },
      ttl: {
        accessToken: parseInt(process.env.TTL, 10),
      },
    },
    uws: {
      port: parseInt(process.env.UWS_PORT, 10),
    },
  });
  let client = null;
  // const AUTHENTICATION_OK = 200;
  // const AUTHENTICATION_ER = 401;
  let logger = null;

  before(async () => {
    logger = new PassThrough();
    logger.on('data', (data) => {
      debuglog(data.toString());
    });
    node = await which('node');
    debuglog('node resolved to', node);

    file = resolve('./index.mjs');

    handle = execa(node, [file], {
    // shell: '/bin/bash',
      extendEnv: true,
      all: true,
      env: {
        NODE_DEBUG: 'LibToken*,TokenServer*',
      },
    });
    handle.all.pipe(logger);
    await startServer(logger);

    client = got.extend({
      prefixUrl: `http://localhost:${LibTokenServerConfig.uws.port}`,
      timeout: 250,
      retry: 0,
    });
  });

  after(async () => {
    await stopServer(handle, logger);
    client = null;
    handle = null;

    logger.removeAllListeners();
    logger.end();
    logger.destroy();
    logger = null;
  });

  it('should resolve ENV', async () => {
    expect(LibTokenServerConfig.token.ctx.length > 0).to.be.true;
    expect(LibTokenServerConfig.token.redis.host.length > 0).to.be.true;
    expect(parseInt(LibTokenServerConfig.token.redis.port, 10)).to.not.be.NaN;
    expect(parseInt(LibTokenServerConfig.token.ttl.accessToken, 10)).to.not.be.NaN;
    expect(parseInt(LibTokenServerConfig.uws.port, 10)).to.not.be.NaN;
  });

  it.only('should obtain Account and Access tokens', async () => {
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
});
