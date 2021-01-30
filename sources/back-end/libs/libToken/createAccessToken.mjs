import {
  CaveatPrefixes,
} from './constants/CaveatPrefixes.mjs';

export const createAccessToken = async (MacaroonBuilder = null, settings = {}, ttl = null, action = null) => {
  if (MacaroonBuilder === null) {
    throw new ReferenceError('MacaroonBuilder is undefined');
  }

  if (ttl === null) {
    throw new ReferenceError('ttl is undefined');
  }

  if (action === null) {
    throw new ReferenceError('action is undefined');
  }

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
    .add_first_party_caveat(`${CaveatPrefixes.TimeScope}:${ttl.from}:${ttl.upto}`)
    .add_first_party_caveat(`${CaveatPrefixes.Action}:${action.type}:${action.object}`)
    .getMacaroon()
    .serialize();
};
