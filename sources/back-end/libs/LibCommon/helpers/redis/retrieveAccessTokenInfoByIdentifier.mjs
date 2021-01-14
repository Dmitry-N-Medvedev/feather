import {
  RedisAccountTokenFields,
} from '../../constants/RedisAccountTokenFields.mjs';

export const retrieveAccessTokenInfoByIdentifier = async (accountTokenIdentifier = null, redisInstance = null) => {
  if (accountTokenIdentifier === null) {
    throw new ReferenceError('accountTokenIdentifier is undefined');
  }

  if (redisInstance === null) {
    throw new ReferenceError('redisInstance is undefined');
  }

  return redisInstance.rawCallAsync(['HMGET', accountTokenIdentifier, ...[RedisAccountTokenFields.USER_ID, RedisAccountTokenFields.SECRET_KEY]]);
};
