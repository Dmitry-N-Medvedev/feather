import mocha from 'mocha';
import chai from 'chai';
import _sodium from 'libsodium-wrappers';
import macaroons from 'macaroons.js';
import {
  nanoid,
} from 'nanoid';
import {
  Locations,
} from '@dmitry-n-medvedev/libcommon/constants/Locations.mjs';
import {
  createAccessToken,
} from '../createAccessToken.mjs';
import {
  createRandomString,
} from '../createRandomString.mjs';
import {
  deriveSubKey,
} from '../helpers/deriveSubKey.mjs';
import {
  ActionTypes,
} from '../constants/ActionTypes.mjs';
import {
  verifyAccessToken,
} from '../verifiers/verifyAccessToken.mjs';

const {
  describe,
  before,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('AccessToken', () => {
  let libsodium = null;
  let masterKey = null;
  const ctx = nanoid(8);

  before(async () => {
    await _sodium.ready;

    libsodium = _sodium;
    masterKey = libsodium.crypto_kdf_keygen(libsodium.Uint8ArrayOutputFormat);
  });

  it('should createAccessToken', async () => {
    const identifier = createRandomString(libsodium);
    const uid = createRandomString(libsodium);
    const secretKey = deriveSubKey(libsodium, ctx, masterKey);
    const tokenSettings = {
      location: Locations.FILE_SERVER,
      secretKey,
      identifier,
      uid,
    };
    const ttl = Object.freeze({
      from: Date.now(),
      upto: Date.now() + 5000,
    });
    const action = Object.freeze({
      type: ActionTypes.READ,
      object: '/questionnaire.json',
    });
    const db = Object.freeze({
      [identifier]: {
        uid,
        secretKey,
      },
    });
    const {
      MacaroonsBuilder,
    } = macaroons;
    const accessToken = await createAccessToken(MacaroonsBuilder, tokenSettings, ttl, action);

    const deserializedAccessToken = MacaroonsBuilder.deserialize(accessToken);
    const resolvedUid = (db[deserializedAccessToken.identifier]).uid ?? null;
    const resolvedSk = (db[deserializedAccessToken.identifier]).secretKey ?? null;
    const expectedActionType = ActionTypes.READ;
    const expectedActionObject = '/questionnaire.json';

    expect(verifyAccessToken(macaroons, deserializedAccessToken, resolvedUid, resolvedSk, expectedActionType, expectedActionObject)).to.be.true;
  });
});
