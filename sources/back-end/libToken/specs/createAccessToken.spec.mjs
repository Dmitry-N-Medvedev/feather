import mocha from 'mocha';
import chai from 'chai';
import _sodium from 'libsodium-wrappers';
import macaroons from 'macaroons.js';
import {
  nanoid,
} from 'nanoid';
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
  TimescopeVerifier,
} from '../verifiers/TimescopeVerifier.mjs';
import {
  ActionTypes,
} from '../constants/ActionTypes.mjs';
import {
  ActionVerifier,
} from '../verifiers/ActionVerifier.mjs';
import {
  CaveatPrefixes,
} from '../constants/CaveatPrefixes.mjs';

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
  const locations = Object.freeze({
    'https://feather-insurance.com/': '0',
  });

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
      location: locations['https://feather-insurance.com/'],
      secretKey,
      identifier,
      uid,
    };
    const ttl = Object.freeze({
      from: Date.now(),
      upto: Date.now() + 5000,
    });
    const action = Object.freeze({
      type: ActionTypes.get,
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

    const deserializedToken = MacaroonsBuilder.deserialize(accessToken);
    const {
      MacaroonsVerifier,
    } = macaroons;

    const verifier = new MacaroonsVerifier(deserializedToken);
    const resolvedUid = (db[deserializedToken.identifier]).uid ?? null;
    const resolvedSk = (db[deserializedToken.identifier]).secretKey ?? null;
    const expectedActionType = ActionTypes.get;
    const expectedActionObject = '/questionnaire.json';

    verifier.satisfyExact(`${CaveatPrefixes.UserId}:${resolvedUid}`);
    verifier.satisfyGeneral(TimescopeVerifier);
    verifier.satisfyGeneral(ActionVerifier(expectedActionType, expectedActionObject));
    verifier.satisfyExact('future:proof:caveat');

    expect(verifier.isValid(resolvedSk)).to.be.true;
  });
});
