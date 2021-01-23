import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import {
  LibTokenServer,
} from '../LibTokenServer.mjs';

const debuglog = util.debuglog(`${LibTokenServer.constructor.name}:specs`);
const {
  describe,
  it,
} = mocha;
const {
  expect,
} = chai;

describe(LibTokenServer.constructor.name, () => {
  it.only('should pass', async () => {
    expect(true).to.be.true;
  });
});
