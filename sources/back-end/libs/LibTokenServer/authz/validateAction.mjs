export const validateAction = (userId = null, action = null) => {
  if (userId === null) {
    throw new ReferenceError('userId is undefined');
  }

  if (action === null) {
    throw new ReferenceError('action is undefined');
  }

  /**
   * NOTE: this is the point where you decide
   * whether to allow this particular `action` for this particular `userId`.
   *
   * This is how an action looks like:

    Action = Object.freeze({
      type: ActionTypes.READ,
      object: '/questionnaire.json',
    });

    You should either return this Action,
    or modify it (e.g. remove the `object` field) to, say, disallow the requested action.

    For now I will just return the action, which means the `userId` will be granted access to the `action.object`
   */

  return action;
};
