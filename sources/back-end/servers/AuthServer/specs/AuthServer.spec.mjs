import util from 'util';
import dotenv from 'dotenv';
import execa from 'execa';
import which from 'which';
import got from 'got';
import mocha from 'mocha';
import chai from 'chai';
import {
  resolve,
} from 'path';
import {
  PassThrough,
} from 'stream';
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
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';

import {
  startAuthServer,
} from './helpers/startAuthServer.mjs';
import {
  stopAuthServer,
} from './helpers/stopAuthServer.mjs';

const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;
const debuglog = util.debuglog('AuthServer:spec');

describe('Auth Server', () => {
  let node = null;
  let file = null;
  let handle = null;
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
  let libTokenFactory = null;
  let accountToken = null;
  let client = null;
  const AUTHENTICATION_OK = 200;
  // const AUTHENTICATION_ER = 401;
  let logger = null;

  before(async () => {
    logger = new PassThrough();
    logger.on('data', (data) => {
      debuglog(data.toString());
    });
    dotenv.config();
    node = await which('node');
    debuglog('node resolved to', node);

    file = resolve('./index.mjs');

    handle = execa(node, [file, '--trace-warnings'], {
    // shell: '/bin/bash',
      extendEnv: true,
      all: true,
      env: {
        NODE_DEBUG: 'AuthServer*,LibAuthServer*',
      },
    });
    handle.all.pipe(logger);
    await startAuthServer(logger);

    libTokenFactory = new LibTokenFactory(LibTokenFactoryConfig, new LibRedisAdapter());
    await libTokenFactory.start();
    accountToken = await libTokenFactory.issueAccountToken();

    client = got.extend({
      prefixUrl: `http://localhost:${process.env.UWS_PORT}`,
      method: 'GET',
      timeout: 250,
      retry: 0,
    });
  });

  after(async () => {
    await stopAuthServer(handle, logger);
    await handle;
    await libTokenFactory.stop();

    libTokenFactory = null;
    accountToken = null;
    client = null;
    handle = null;

    logger.removeAllListeners();
    logger.end();
    logger.destroy();
    logger = null;
  });

  it('should resolve node', async () => {
    expect(node).to.exist;
  });

  it('should resolve ENV', async () => {
    expect(parseInt(process.env.UWS_PORT, 10)).to.not.be.NaN;
    expect(process.env.REDIS_HOST).to.not.be.empty;
    expect(parseInt(process.env.REDIS_PORT, 10)).to.not.be.NaN;
  });

  // eslint-disable-next-line prefer-arrow-callback
  it('should succeed to authenticate a GET request', async function succeedAuth() {
    const filePath = `${nanoid(16)}.${nanoid(3)}`;
    const forAction = Object.freeze({
      type: ActionTypes.READ,
      object: `/questionnaires/${filePath}`,
    });
    const accessToken = await libTokenFactory.issueAccessToken(forAction, accountToken, Locations.FILE_SERVER);

    try {
      const response = await client(`questionnaires/${filePath}`, {
        headers: {
          Authorization: accessToken,
        },
      });
      expect(response.statusCode).to.equal(AUTHENTICATION_OK);
    } catch (error) {
      debuglog(error);
    }
  });
});
