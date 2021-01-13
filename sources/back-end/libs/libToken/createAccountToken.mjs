import {
  Locations,
} from '@dmitry-n-medvedev/libcommon/constants/Locations.mjs';
import {
  CaveatPrefixes,
} from './constants/CaveatPrefixes.mjs';

const PREDEFINED_LOCATION = Locations.TOKEN_SERVER.toString();

export const createAccountToken = async (MacaroonBuilder = null, settings = {}) => {
  if (MacaroonBuilder === null) {
    throw new ReferenceError('MacaroonBuilder is undefined');
  }

  // TODO: use ajv: https://github.com/ajv-validator/ajv
  if (Object.keys(settings).length === 0) {
    throw new Error('settings are empty');
  }

  const {
    secretKey,
    identifier,
    uid,
  } = settings;

  const result = MacaroonBuilder.create(PREDEFINED_LOCATION, secretKey, identifier);

  return MacaroonBuilder
    .modify(result)
    .add_first_party_caveat(`${CaveatPrefixes.UserId}:${uid}`)
    .getMacaroon()
    .serialize();
};
