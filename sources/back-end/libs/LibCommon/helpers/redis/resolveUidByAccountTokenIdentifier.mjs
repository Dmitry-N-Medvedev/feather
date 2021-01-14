export const resolveUidByAccountTokenIdentifier = async (accountTokenIdentifier = null, redisInstance = null, accountTokenField = null) => {
  if (accountTokenIdentifier === null) {
    throw new ReferenceError('accountTokenIdentifier is undefined');
  }

  if (redisInstance === null) {
    throw new ReferenceError('redisInstance is undefined');
  }

  if (accountTokenField === null) {
    throw new ReferenceError('accountTokenField is undefined');
  }

  return redisInstance.rawCallAsync(['HGET', accountTokenIdentifier, accountTokenField]);
};
