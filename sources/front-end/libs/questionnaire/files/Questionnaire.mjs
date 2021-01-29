// import {
//   createMachine,
//   interpret,
//   assign,
// } from 'xstate';

/*

  - First name
  - Address
  - If they have any children(boolean)
  - If yes → How many do they have ?
    - Their occupation
      - Employed
      - Student
      - Self-employed
  - Email address

*/

const validateString = (context, event) => new Promise((resolve, reject) => {
  if (event.type !== 'reply') {
    return reject(new TypeError(`event type "${event.type}" was not expected`));
  }

  const {
    payload: {
      id,
      value,
    },
  } = event;

  const {
    response: {
      type,
      validation,
    },
  } = context.questions[id];

  if (type !== 'string') {
    return reject(new TypeError(`wrong validator: type ${type} is not a string`));
  }

  if (typeof value !== 'string') {
    return reject(new TypeError(`expected ${value} to be a string`));
  }

  if ('length' in validation) {
    if (value.length < validation.length.min || value.length > validation.length.max) {
      return reject(new EvalError(
        `the length of the ${value} (${value.length}) is outside of the acceptable boundary: [${validation.length.min}..${validation.length.max}]`,
      ));
    }
  }

  return resolve();
});

const validateBoolean = (context, event) => new Promise((resolve, reject) => {
  if (event.type !== 'reply') {
    return reject(new TypeError(`event type "${event.type}" was not expected`));
  }

  const {
    payload: {
      id,
      value,
    },
  } = event;

  const {
    response: {
      type,
    },
  } = context.questions[id];

  if (type !== 'boolean') {
    return reject(new TypeError(`wrong validator: type ${type} is not a boolean`));
  }

  if (typeof value !== 'boolean') {
    return reject(new TypeError(`expected ${value} to be a boolean`));
  }

  return resolve();
});

const validateInt = (context, event) => new Promise((resolve, reject) => {
  if (event.type !== 'reply') {
    return reject(new TypeError(`event type "${event.type}" was not expected`));
  }

  const {
    payload: {
      id,
      value,
    },
  } = event;

  const {
    response: {
      type,
      validation: {
        min,
        max,
      },
    },
  } = context.questions[id];

  if (type !== 'integer') {
    return reject(new TypeError(`wrong validator: type ${type} is not an integer`));
  }

  if (Number.isInteger(value) === false) {
    return reject(new TypeError(`the ${value} is expected to be an integer`));
  }

  if (value < min || value > max) {
    return reject(
      new EvalError(`${value} is outside of the acceptable boundary: [${min}..${max}]`),
    );
  }

  return resolve();
});

const responderHasChildren = (context) => context.answers.haveChildren === true;

const allChildrenDetailsCollected = (context) => {
  const result = context.answers.childrenDetails.length === context.answers.howManyChildren;

  // console.log('[guard] allChildrenDetailsCollected:', result, context.answers, context.answers.howManyChildren);

  return result;
};

const createQuestionnaire = (xstate, askQuestion) => xstate.createMachine({
  id: 'Questionnaire',
  context: {
    questions: {
      firstName: {
        id: 'firstName',
        question: 'what is your first name',
        response: {
          type: 'string',
          validation: {
            length: {
              min: 2,
              max: 20,
            },
          },
        },
      },
      address: {
        id: 'address',
        question: 'where do you live',
        response: {
          type: 'string',
          validation: {
            length: {
              min: 10,
              max: 250,
            },
          },
        },
      },
      haveChildren: {
        id: 'haveChildren',
        question: 'do you have children',
        response: {
          type: 'boolean',
        },
      },
      howManyChildren: {
        id: 'howManyChildren',
        question: 'how many children do you have',
        response: {
          type: 'integer',
          validation: {
            min: 1,
            max: Number.MAX_SAFE_INTEGER,
          },
        },
      },
      childOccupation: {
        id: 'childOccupation',
        question: 'your child occupation',
        response: {
          type: 'string',
          validation: {
            allowedValues: ['employed', 'student', 'self-employed'],
          },
        },
      },
      emailAddress: {
        id: 'emailAddress',
        question: 'what is your email address',
        response: {
          type: 'string',
          validation: {},
        },
      },
    },
    answers: {
      childrenDetails: [],
    },
  },
  initial: 'firstName',
  states: {
    firstName: {
      entry: [
        (context) => {
          askQuestion({
            type: 'question',
            payload: {
              value: context.questions.firstName,
            },
          });
        },
      ],
      on: {
        reply: {
          actions: [
            xstate.assign({
              answers: (context, event) => {
                context.answers = {
                  ...context.answers,
                  [event.payload.id]: event.payload.value,
                };

                return context.answers;
              },
            }),
          ],
          target: ['validateFirstName'],
        },
      },
    },
    validateFirstName: {
      invoke: {
        id: 'validateFirstName',
        src: validateString,
        onDone: {
          target: 'address',
        },
        onError: {
          target: 'firstName',
        },
      },
    },
    address: {
      entry: [
        (context) => {
          askQuestion({
            type: 'question',
            payload: {
              value: context.questions.address,
            },
          });
        },
      ],
      on: {
        reply: {
          actions: [
            xstate.assign({
              answers: (context, event) => {
                context.answers = {
                  ...context.answers,
                  [event.payload.id]: event.payload.value,
                };

                return context.answers;
              },
            }),
          ],
          target: ['validateAddress'],
        },
      },
    },
    validateAddress: {
      invoke: {
        id: 'validateAddress',
        src: validateString,
        onDone: {
          target: 'haveChildren',
        },
        onError: {
          target: 'address',
        },
      },
    },
    haveChildren: {
      entry: [
        (context) => {
          askQuestion({
            type: 'question',
            payload: {
              value: context.questions.haveChildren,
            },
          });
        },
      ],
      on: {
        reply: {
          actions: [
            xstate.assign({
              answers: (context, event) => {
                context.answers = {
                  ...context.answers,
                  [event.payload.id]: event.payload.value,
                };

                return context.answers;
              },
            }),
          ],
          target: ['validateHaveChildren'],
        },
      },
    },
    validateHaveChildren: {
      invoke: {
        id: 'validateHaveChildren',
        src: validateBoolean,
        onDone: {
          target: 'shouldAskForChildrenDetails',
        },
        onError: {
          target: 'haveChildren',
        },
      },
    },
    shouldAskForChildrenDetails: {
      always: [
        {
          target: 'howManyChildren',
          cond: {
            type: 'responderHasChildren',
          },
        },
        {
          target: 'askForEmailAddress',
        },
      ],
    },
    howManyChildren: {
      entry: [
        (context) => {
          askQuestion({
            type: 'question',
            payload: {
              value: context.questions.howManyChildren,
            },
          });
        },
      ],
      on: {
        reply: {
          actions: [
            xstate.assign({
              answers: (context, event) => {
                context.answers = {
                  ...context.answers,
                  [event.payload.id]: event.payload.value,
                };

                return context.answers;
              },
            }),
          ],
          target: ['validateHowManyChildren'],
        },
      },
    },
    validateHowManyChildren: {
      invoke: {
        id: 'validateHowManyChildren',
        src: validateInt,
        onDone: {
          target: 'askForChildrenDetails',
        },
        onError: {
          target: 'howManyChildren',
        },
      },
    },
    askForChildrenDetails: {
      always: [
        {
          target: 'askForEmailAddress',
          cond: 'allChildrenDetailsCollected',
        },
        {
          target: 'askForChildOccupation',
        },
      ],
    },
    askForChildOccupation: {
      entry: [
        (context) => {
          askQuestion({
            type: 'question',
            payload: {
              value: context.questions.childOccupation,
            },
          });
        },
      ],
      on: {
        reply: {
          actions: [
            xstate.assign({
              answers: (context, event) => {
                context.answers = {
                  ...context.answers,
                  ...{
                    childrenDetails: [...context.answers.childrenDetails, event.payload.value],
                  },
                };

                return context.answers;
              },
            }),
          ],
          target: ['askForChildrenDetails'],
        },
      },
    },
    askForEmailAddress: {
      entry: [
        (context) => {
          askQuestion({
            type: 'question',
            payload: {
              value: context.questions.emailAddress,
            },
          });
        },
      ],
      on: {
        reply: {
          actions: [
            xstate.assign({
              answers: (context, event) => {
                context.answers = {
                  ...context.answers,
                  [event.payload.id]: event.payload.value,
                };

                return context.answers;
              },
            }),
          ],
          target: ['final_OK'],
        },
      },
    },
    final_OK: {
      type: 'final',
      data: (context) => context.answers,
    },
    final_ER: {
      type: 'final',
    },
  },
}, {
  actions: {},
  activities: {},
  delays: {},
  guards: {
    responderHasChildren,
    allChildrenDetailsCollected,
  },
  services: {},
});

export default (xstate, askQuestion) => xstate.interpret(createQuestionnaire(xstate, askQuestion), {
  execute: true,
});
