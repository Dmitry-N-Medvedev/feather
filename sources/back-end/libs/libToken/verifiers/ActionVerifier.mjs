import {
  ActionTypes,
} from '../constants/ActionTypes.mjs';
import {
  CaveatPrefixes,
} from '../constants/CaveatPrefixes.mjs';

const re = new RegExp(`^${CaveatPrefixes.Action}:(?<actionType>\\w+):(?<actionObject>\\S+)$`, 'is');

export const ActionVerifier = (expectedActionType = null, expectedActionObject = null) => (caveat = null) => {
  if (caveat === null) {
    return false;
  }

  const match = re.exec(caveat) ?? null;

  if (match !== null) {
    const actionType = parseInt(match.groups.actionType, 16);
    const {
      actionObject,
    } = match.groups;

    if (Object.values(ActionTypes).includes(actionType) === false) {
      return false;
    }

    return (actionType === expectedActionType && actionObject === expectedActionObject);
  }

  return false;
};
