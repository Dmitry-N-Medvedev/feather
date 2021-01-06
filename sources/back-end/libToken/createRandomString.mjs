export const createRandomString = (libsodium = null) => {
  if (libsodium === null) {
    throw new ReferenceError('libsodium is undefined');
  }

  return libsodium.to_base64(
    libsodium.randombytes_buf(libsodium.crypto_secretbox_KEYBYTES),
    libsodium.base64_variants.URLSAFE,
  );
};
