import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import {
  Locations,
} from '../constants/Locations.mjs';

const debuglog = util.debuglog('specs');
const {
  describe,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibCommon', () => {
  describe('Locations', () => {
    it('should validate Locations', async () => {
      expect(Locations).to.be.frozen;
      expect(Object.keys(Locations).length > 0).to.be.true;
    });
  });
});
