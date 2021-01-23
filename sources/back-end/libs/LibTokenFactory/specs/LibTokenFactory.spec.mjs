import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import macaroons from 'macaroons.js';
import {
  nanoid,
} from 'nanoid';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  ActionTypes,
} from '@dmitry-n-medvedev/libtoken/constants/ActionTypes.mjs';
import {
  Locations,
} from '@dmitry-n-medvedev/libcommon/constants/Locations.mjs';
import {
  LibTokenFactory,
} from '../LibTokenFactory.mjs';
import {
  resolveTokenIdentifierName,
} from '../helpers/resolveTokenIdentifierName.mjs';
import {
  validateAction,
} from '../authz/validateAction.mjs';

const debuglog = util.debuglog('LibTokenFactory:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

mocha.Runner.prototype.uncaught = (err) => {
  debuglog('UNCAUGHT ERROR', err);
};

describe('LibTokenFactory', () => {
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

    return specRedisInstance.rawCallAsync(['DEL', ...keysToDelete]);
  };

  before(async () => {
    libRedisAdapter = new LibRedisAdapter();
    specRedisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig, SpecRedisInstanceName);
    libTokenFactory = new LibTokenFactory(LibTokenFactoryConfig, libRedisAdapter);

    // eslint-disable-next-line no-return-await
    return await libTokenFactory.start();
  });

  after(async () => {
    deleteKeys();

    if (libTokenFactory !== null) {
      await libTokenFactory.stop();
    }

    if (libRedisAdapter !== null) {
      await libRedisAdapter.destroy();
    }
  });

  it('should issueAccountToken', async () => {
    const serializedAccountToken = await libTokenFactory.issueAccountToken();

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
    const serializedAccountToken = await libTokenFactory.issueAccountToken();
    const serializedAccessToken = await libTokenFactory.issueAccessToken(forAction, serializedAccountToken, Locations.FILE_SERVER);

    expect(serializedAccessToken).to.exist;

    const deserializedAccessToken = MacaroonsBuilder.deserialize(serializedAccessToken);
    const {
      identifier,
    } = deserializedAccessToken;

    keysToDelete.push(identifier);
  });

  it('should fail to issueAccessToken w/ undefined forAction', async () => {
    const forAction = null;
    const serializedAccountToken = await libTokenFactory.issueAccountToken();

    let error = null;

    try {
      await libTokenFactory.issueAccessToken(forAction, serializedAccountToken, Locations.FILE_SERVER);
    } catch (forActionError) {
      error = forActionError;
    }

    expect(error).to.be.an.instanceof(ReferenceError);
  });

  it('should fail to issueAccessToken w/ undefined accountToken', async () => {
    const forAction = Object.freeze({
      type: ActionTypes.READ,
      object: '/questionnaire.json',
    });
    const undefinedAccountToken = null;

    let error = null;

    try {
      await libTokenFactory.issueAccessToken(forAction, undefinedAccountToken, Locations.FILE_SERVER);
    } catch (forActionError) {
      error = forActionError;
    }

    expect(error).to.be.an.instanceof(ReferenceError);
  });

  it('undefined Location should lead to an Access Token with Locations.INVALID_LOCATION', async () => {
    const forAction = Object.freeze({
      type: ActionTypes.READ,
      object: '/questionnaire.json',
    });
    const undefinedLocation = null;
    const serializedAccountToken = await libTokenFactory.issueAccountToken();

    const serializedAccessToken = await libTokenFactory.issueAccessToken(forAction, serializedAccountToken, undefinedLocation);
    const deserializedAccessToken = MacaroonsBuilder.deserialize(serializedAccessToken);

    const {
      location,
    } = deserializedAccessToken;

    expect(location).to.equal(Locations.INVALID_LOCATION.toString());
  });

  it('should check resolveTokenIdentifierName', async () => {
    const validArgs = Object.freeze([
      [nanoid(5), nanoid(5)],
    ]);
    const invalidArgs = Object.freeze([
      [nanoid(5), null],
      [null, nanoid(5)],
      [null, null],
    ]);

    for (const [tokenType, forIdentifier] of validArgs) {
      const name = resolveTokenIdentifierName(tokenType, forIdentifier);

      expect(name.length > 0).to.be.true;
    }

    for (const [tokenType, forIdentifier] of invalidArgs) {
      let error = null;

      try {
        resolveTokenIdentifierName(tokenType, forIdentifier);
      } catch (nameError) {
        error = nameError;
      }

      expect(error).to.be.an.instanceof(ReferenceError);
    }
  });

  it('should validateAction', async () => {
    const validParameters = Object.freeze([
      [nanoid(), {
        type: ActionTypes.READ,
        object: '/questionnaire.json',
      }],
    ]);
    const invalidParameters = Object.freeze([
      [nanoid(), null],
      [null, {
        type: ActionTypes.READ,
        object: '/questionnaire.json',
      }],
      [null, null],
    ]);

    for (const [userId, action] of validParameters) {
      const resolvedAction = validateAction(userId, action);

      expect(resolvedAction).to.deep.equal(action);
    }

    for (const [userId, action] of invalidParameters) {
      let error = null;

      try {
        const resolvedAction = validateAction(userId, action);

        expect(resolvedAction).to.not.exist;
      } catch (validationError) {
        error = validationError;
      }

      expect(error).to.be.an.instanceof(ReferenceError);
    }
  });
});
