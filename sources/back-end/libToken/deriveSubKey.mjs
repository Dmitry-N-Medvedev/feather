function* genSubkey() {
  let subkeyId = 0;

  while (true) {
    // eslint-disable-next-line no-plusplus
    yield subkeyId++;

    if (subkeyId >= Number.MAX_SAFE_INTEGER) {
      subkeyId = 0;
    }
  }
}

const subkeyGenerator = genSubkey();

export const deriveSubKey = (libsodium = null, ctx = null, masterKey = null) => {
  if (libsodium === null) {
    throw new ReferenceError('libsodium is undefined');
  }

  if (ctx === null) {
    throw new ReferenceError('ctx is undefined');
  }

  if (ctx.length < libsodium.crypto_kdf_CONTEXTBYTES) {
    throw new Error(`ctx is too short. Got ${ctx.length} bytes instead of ${libsodium.crypto_kdf_CONTEXTBYTES}`);
  }

  if (ctx.length > libsodium.crypto_kdf_CONTEXTBYTES) {
    throw new Error(`ctx is too long. Got ${ctx.length} bytes instead of ${libsodium.crypto_kdf_CONTEXTBYTES}`);
  }

  if (masterKey === null) {
    throw new ReferenceError('masterKey is undefined');
  }

  return Buffer.from(libsodium.crypto_kdf_derive_from_key(
    libsodium.crypto_kdf_BYTES_MAX,
    subkeyGenerator.next().value,
    ctx,
    masterKey,
  ).buffer);
};
