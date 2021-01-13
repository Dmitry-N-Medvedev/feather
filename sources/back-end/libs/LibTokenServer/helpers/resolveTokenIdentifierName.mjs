export const resolveTokenIdentifierName = (tokenType = null, forIdentifier = null) => {
  if (tokenType === null) {
    throw new ReferenceError('tokenType is undefined');
  }

  if (forIdentifier === null) {
    throw new ReferenceError('forIdentifier is undefined');
  }

  return `${tokenType}:${forIdentifier}`;
};
