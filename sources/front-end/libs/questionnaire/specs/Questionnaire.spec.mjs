import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import xstate from 'xstate';

import Questionnaire from '../files/Questionnaire.mjs';

const debuglog = util.debuglog('Questionnaire:specs');
const {
  describe,
  it,
} = mocha;
const {
  expect,
} = chai;

// FIXME: remove this when everything is ready
describe('Questionnaire', () => {
  it.only('should conduct the Questionnaire', () => new Promise((resolve, reject) => {
    let questionnaire = null;
    const expectedReplies = Object.freeze({
      firstName: 'Nikolay',
      address: 'Lohmühlenstraße 65, 12435 Berlin',
      haveChildren: true,
      howManyChildren: Math.floor(Math.random() * 2 + 2),
      emailAddress: 'hello@feather-insurance.com',
    });

    const receiveQuestion = (question) => {
      switch (question.payload.value.id) {
        case 'firstName': {
          questionnaire.send({
            type: 'reply',
            payload: {
              id: question.payload.value.id,
              value: expectedReplies.firstName,
            },
          });

          return resolve();
        }
        case 'address': {
          questionnaire.send({
            type: 'reply',
            payload: {
              id: question.payload.value.id,
              value: expectedReplies.address,
            },
          });

          return resolve();
        }
        case 'haveChildren': {
          questionnaire.send({
            type: 'reply',
            payload: {
              id: question.payload.value.id,
              value: expectedReplies.haveChildren,
            },
          });

          return resolve();
        }
        case 'howManyChildren': {
          questionnaire.send({
            type: 'reply',
            payload: {
              id: question.payload.value.id,
              value: expectedReplies.howManyChildren,
            },
          });

          return resolve();
        }
        case 'childOccupation': {
          const randomOccupation = question.payload.value.response.validation.allowedValues[
            Math.floor(Math.random() * Math.floor(question.payload.value.response.validation.allowedValues.length))
          ];

          questionnaire.send({
            type: 'reply',
            payload: {
              id: question.payload.value.id,
              value: randomOccupation,
            },
          });

          return resolve();
        }
        case 'emailAddress': {
          questionnaire.send({
            type: 'reply',
            payload: {
              id: question.payload.value.id,
              value: expectedReplies.emailAddress,
            },
          });

          return resolve();
        }
        default: {
          return reject(new TypeError('unknown question'));
        }
      }
    };

    questionnaire = Questionnaire(xstate, receiveQuestion);

    questionnaire
      .onDone((data) => {
        expect(data).to.deep.equal(expectedReplies);

        resolve();
      })
      .start();

    expect(true).to.be.true;
  }));
});
