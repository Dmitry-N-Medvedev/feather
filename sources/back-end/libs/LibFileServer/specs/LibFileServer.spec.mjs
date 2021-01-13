import mocha from 'mocha';
import chai from 'chai';
import util from 'util';
import {
  resolve,
} from 'path';
import {
  LibFileServer,
} from '../LibFileServer.mjs';

const debuglog = util.debuglog('LibFileServer:specs');
const {
  describe,
  it,
} = mocha;
const {
  expect,
} = chai;

// FIXME: remove this line when code is ready to have it merged automatically on github

describe('LibFileServer', () => {
  it.only('should start/stop the LibFileServer', async () => {
    const LibFileServerConfig = Object.freeze({
      cwd: resolve(process.cwd(), './specs/cwd'),
    });
    const libFileServer = new LibFileServer(LibFileServerConfig);

    expect(libFileServer).to.exist;

    await libFileServer.start();

    expect(libFileServer.files).is.frozen;

    await libFileServer.stop();
  });
});
