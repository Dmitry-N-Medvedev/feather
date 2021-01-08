import {
  CaveatPrefixes,
} from '../constants/CaveatPrefixes.mjs';

export const verifyAccountToken = (libmacaroons = null, deserializedAccountToken = null, uid = null, secretKey = null) => {
  if (libmacaroons === null) {
    throw new ReferenceError('libmacaroons is undefined');
  }

  if (deserializedAccountToken === null) {
    throw new ReferenceError('deserializedAccountToken is undefined');
  }

  if (uid === null) {
    throw new ReferenceError('uid is undefined');
  }

  if (secretKey === null) {
    throw new ReferenceError('secretKey is undefined');
  }

  const verifier = new libmacaroons.MacaroonsVerifier(deserializedAccountToken);

  verifier.satisfyExact(`${CaveatPrefixes.UserId}:${uid}`);

  return verifier.isValid(secretKey);
};
