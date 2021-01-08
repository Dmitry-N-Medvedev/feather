import {
  CaveatPrefixes,
} from '../constants/CaveatPrefixes.mjs';

const re = new RegExp(`^${CaveatPrefixes.TimeScope}:(?<from>\\d+):(?<upto>\\d+)$`, 'si');

export const TimescopeVerifier = (caveat = null) => {
  if (caveat === null) {
    throw new ReferenceError('caveat is undefined');
  }

  const match = re.exec(caveat) ?? null;

  if (match !== null) {
    const {
      from,
    } = match.groups;
    const {
      upto,
    } = match.groups;

    return from < Date.now() < upto;
  }

  return false;
};
