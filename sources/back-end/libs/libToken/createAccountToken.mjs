import {
  CaveatPrefixes,
} from './constants/CaveatPrefixes.mjs';

export const createAccountToken = async (MacaroonBuilder = null, settings = {}) => {
  if (MacaroonBuilder === null) {
    throw new ReferenceError('MacaroonBuilder is undefined');
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

  const result = MacaroonBuilder.create(location.toString(), secretKey, identifier);

  return MacaroonBuilder
    .modify(result)
    .add_first_party_caveat(`${CaveatPrefixes.UserId}:${uid}`)
    .getMacaroon()
    .serialize();
};
