import {
  createMachine,
  interpret,
} from 'xstate';

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

const Questionnaire = createMachine({
  id: 'Questionnaire',
  context: {
    initialQuestionId: '0',
    questions: {
      0: {
        question: {
          text: 'First name',
        },
      },
    },
    answers: {},
  },
  initial: 'initial',
  states: {
    initial: {},
  },
}, {
  actions: {},
  activities: {},
  delays: {},
  guards: {},
  services: {},
});

export default interpret(Questionnaire);
