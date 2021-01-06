/*
  caveat = ttl:from:upto

  e.g.: ttl:1609971405614:1609971406614
*/

const re = /^ttl:(?<from>\d+):(?<upto>\d+)$/is;

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
