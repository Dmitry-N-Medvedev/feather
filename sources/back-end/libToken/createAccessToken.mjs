export const createAccessToken = async (MacaroonBuilder = null, settings = {}, acl = null, ttl = null) => {
  if (MacaroonBuilder === null) {
    throw new ReferenceError('MacaroonBuilder is undefined');
  }

  if (acl === null) {
    throw new ReferenceError('acl is undefined');
  }

  if (ttl === null) {
    throw new ReferenceError('ttl is undefined');
  }

  // TODO: use ajv: https://github.com/ajv-validator/ajv
  if (Object.keys(settings).length === 0) {
    throw new Error('settings are empty');
  }

  const {
    location,
    secretKey,
    identifier,
    uid,
  } = settings;

  const result = MacaroonBuilder.create(location, secretKey, identifier);

  return MacaroonBuilder
    .modify(result)
    .add_first_party_caveat(`uid:${uid}`)
    .add_first_party_caveat(`ttl:${ttl.from}:${ttl.upto}`)
    .add_first_party_caveat(`acl:${acl}`)
    .getMacaroon()
    .serialize();
};
