import {
  CaveatPrefixes,
} from '../constants/CaveatPrefixes.mjs';
import {
  TimescopeVerifier,
} from './TimescopeVerifier.mjs';
import {
  ActionVerifier,
} from './ActionVerifier.mjs';

export const verifyAccessToken = (
  libmacaroons = null,
  deserializedAccessToken = null,
  uid = null,
  secretKey = null,
  actionType = null,
  actionObject = null,
) => {
  if (libmacaroons === null) {
    throw new ReferenceError('libmacaroons is undefined');
  }

  if (deserializedAccessToken === null) {
    throw new ReferenceError('deserializedAccessToken is undefined');
  }

  if (uid === null) {
    throw new ReferenceError('uid is undefined');
  }

  if (secretKey === null) {
    throw new ReferenceError('secretKey is undefined');
  }

  if (actionType === null) {
    throw new ReferenceError('actionType is undefined');
  }

  if (actionObject === null) {
    throw new ReferenceError('actionObject is undefined');
  }

  const verifier = new libmacaroons.MacaroonsVerifier(deserializedAccessToken);

  verifier.satisfyExact(`${CaveatPrefixes.UserId}:${uid}`);
  verifier.satisfyGeneral(TimescopeVerifier);
  verifier.satisfyGeneral(ActionVerifier(actionType, actionObject));

  return verifier.isValid(secretKey);
};
