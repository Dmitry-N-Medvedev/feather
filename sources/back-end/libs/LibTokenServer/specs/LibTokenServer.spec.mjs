import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import macaroons from 'macaroons.js';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  ActionTypes,
} from '@dmitry-n-medvedev/libtoken/constants/ActionTypes.mjs';
import {
  LibTokenServer,
} from '../LibTokenServer.mjs';

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

describe('LibTokenServer', () => {
  const LibTokenServerConfig = Object.freeze({
    ctx: 'featheri',
    locations: {
      'https://feather-insurance.com/': 0x1,
      'https://file-server.feather-insurance.com/': 0x2,
    },
    redis: {
      host: '127.0.0.1',
      port: 6379,
    },
    ttl: {
      accessToken: 500,
    },
  });
  let libTokenServer = null;
  let libRedisAdapter = null;
  const SpecRedisInstanceName = 'SpecRedisInstance';
  const LibRedisAdapterConfig = Object.freeze({
    host: '127.0.0.1',
    port: 6379,
  });
  let specRedisInstance = null;
  const {
    MacaroonsBuilder,
  } = macaroons;

  const keysToDelete = [];

  const deleteKeys = async () => {
    if (keysToDelete.length === 0) {
      return Promise.resolve();
    }

    for await (const key of keysToDelete) {
      await specRedisInstance.rawCallAsync(['DEL', key]);
    }

    return Promise.resolve();
  };

  before(async () => {
    libRedisAdapter = new LibRedisAdapter();
    specRedisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig, SpecRedisInstanceName);
    libTokenServer = new LibTokenServer(LibTokenServerConfig);

    return libTokenServer.start();
  });

  after(async () => {
    await deleteKeys();

    if (libTokenServer !== null) {
      await libTokenServer.stop();
    }

    if (libRedisAdapter !== null) {
      await libRedisAdapter.destroy();
    }

    return Promise.resolve();
  });

  it('should issueAccountToken', async () => {
    const serializedAccountToken = await libTokenServer.issueAccountToken();

    expect(serializedAccountToken.length > 0).to.be.true;

    const deserializedAccountToken = MacaroonsBuilder.deserialize(serializedAccountToken);

    expect(deserializedAccountToken).to.exist;

    const {
      identifier,
    } = deserializedAccountToken;

    expect(identifier).to.exist;

    keysToDelete.push(identifier);
  });

  it('should issueAccessToken', async () => {
    const forAction = Object.freeze({
      type: ActionTypes.READ,
      object: '/questionnaire.json',
    });
    const serializedAccountToken = await libTokenServer.issueAccountToken();
    const serializedAccessToken = await libTokenServer.issueAccessToken(forAction, serializedAccountToken);
    const deserializedAccessToken = MacaroonsBuilder.deserialize(serializedAccessToken);

    expect(deserializedAccessToken).to.exist;

    const {
      identifier,
    } = deserializedAccessToken;

    keysToDelete.push(identifier);
  });
});
