import util from 'util';
import mocha from 'mocha';
import chai from 'chai';

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
  it.only('should conduct the Questionnaire', async () => {
    expect(true).to.be.true;
  });
});
