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
  AccessTokenTypes,
} from '../AccessTokenTypes.mjs';
import {
  createRandomString,
} from '../createRandomString.mjs';
import {
  deriveSubKey,
} from '../deriveSubKey.mjs';
import {
  TimescopeVerifier,
} from '../verifiers/TimescopeVerifier.mjs';
import {
  ACLVerifier,
} from '../verifiers/ACLVerifier.mjs';

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
    const acl = AccessTokenTypes.ReadQuestionnaireList;
    const ttl = Object.freeze({
      from: Date.now(),
      upto: Date.now() + 1000,
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
    const accessToken = await createAccessToken(MacaroonsBuilder, tokenSettings, acl, ttl);

    const deserializedToken = MacaroonsBuilder.deserialize(accessToken);
    const {
      MacaroonsVerifier,
    } = macaroons;

    const verifier = new MacaroonsVerifier(deserializedToken);
    const resolvedUid = (db[deserializedToken.identifier]).uid ?? null;
    const resolvedSk = (db[deserializedToken.identifier]).secretKey ?? null;
    const expectedACL = AccessTokenTypes.ReadQuestionnaireList;

    verifier.satisfyExact(`uid:${resolvedUid}`);
    verifier.satisfyGeneral(TimescopeVerifier);
    verifier.satisfyGeneral(ACLVerifier(expectedACL));
    verifier.satisfyExact('future:proof:caveat');

    expect(verifier.isValid(resolvedSk)).to.be.true;
  });
});
