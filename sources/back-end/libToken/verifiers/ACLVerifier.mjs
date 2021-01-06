/*
  caveat = acl:Number

  e.g.: acl:1
*/

const re = /^acl:(?<flags>\d+)$/si;

export const ACLVerifier = (expectedACL = null) => {
  if (expectedACL === null) {
    throw new ReferenceError('expectedACL is undefined');
  }

  return (caveat = null) => {
    if (caveat === null) {
      throw new ReferenceError('caveat is undefined');
    }

    const match = re.exec(caveat) ?? null;

    if (match !== null) {
      const {
        flags,
      } = match.groups;
      const flagsNum = parseInt(flags, 16);
      const expectedACLNum = parseInt(expectedACL, 16);

      return Boolean(expectedACLNum & flagsNum);
    }

    return false;
  };
};
