import mocha from 'mocha';
import chai from 'chai';
import _sodium from 'libsodium-wrappers';
import macaroons from 'macaroons.js';
import {
  nanoid,
} from 'nanoid';
import {
  createAccountToken,
} from '../createAccountToken.mjs';
import {
  createRandomString,
} from '../createRandomString.mjs';
import {
  deriveSubKey,
} from '../deriveSubKey.mjs';

const {
  describe,
  before,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('AccountToken', () => {
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

  it('should createAccountToken', async () => {
    const identifier = createRandomString(libsodium);
    const uid = createRandomString(libsodium);
    const secretKey = deriveSubKey(libsodium, ctx, masterKey);
    const tokenSettings = {
      location: locations['https://feather-insurance.com/'],
      secretKey,
      identifier,
      uid,
    };
    const db = Object.freeze({
      [identifier]: {
        uid,
        secretKey,
      },
    });
    const {
      MacaroonsBuilder,
    } = macaroons;
    const accountToken = await createAccountToken(MacaroonsBuilder, tokenSettings);

    const deserializedToken = MacaroonsBuilder.deserialize(accountToken);

    expect(deserializedToken.identifier).to.equal(identifier);
    expect(deserializedToken.location).to.equal(tokenSettings.location);

    const {
      MacaroonsVerifier,
    } = macaroons;

    const verifier = new MacaroonsVerifier(deserializedToken);

    const resolvedUid = (db[deserializedToken.identifier]).uid ?? null;
    const resolvedSk = (db[deserializedToken.identifier]).secretKey ?? null;

    verifier.satisfyExact(`uid:${resolvedUid}`);
    verifier.satisfyExact('future:proof:caveat');

    expect(verifier.isValid(resolvedSk)).to.be.true;
  });
});
