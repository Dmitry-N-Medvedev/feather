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
  createAccountToken,
} from '../createAccountToken.mjs';
import {
  createRandomString,
} from '../createRandomString.mjs';
import {
  deriveSubKey,
} from '../helpers/deriveSubKey.mjs';
import {
  verifyAccountToken,
} from '../verifiers/verifyAccountToken.mjs';

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
    const expectedLocation = Locations.TOKEN_SERVER.toString();
    const accountToken = await createAccountToken(MacaroonsBuilder, tokenSettings);
    const deserializedAccountToken = MacaroonsBuilder.deserialize(accountToken);

    expect(deserializedAccountToken.identifier).to.equal(identifier);
    expect(deserializedAccountToken.location).to.equal(expectedLocation);

    const resolvedUid = (db[deserializedAccountToken.identifier]).uid ?? null;
    const resolvedSecretKey = (db[deserializedAccountToken.identifier]).secretKey ?? null;

    expect(verifyAccountToken(macaroons, deserializedAccountToken, resolvedUid, resolvedSecretKey)).to.be.true;
  });
});
