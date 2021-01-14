import mocha from 'mocha';
import chai from 'chai';
import util from 'util';
import {
  resolve,
} from 'path';
import {
  LibFileIndex,
} from '../LibFileIndex.mjs';

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
  it.only('should start/stop the LibFileIndex', async () => {
    const LibFileIndexConfig = Object.freeze({
      cwd: resolve(process.cwd(), './specs/cwd'),
    });
    const libFileIndex = new LibFileIndex(LibFileIndexConfig);

    expect(libFileIndex).to.exist;

    await libFileIndex.start();

    expect(libFileIndex.files).is.frozen;

    await libFileIndex.stop();
  });
});
