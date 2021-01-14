import mocha from 'mocha';
import chai from 'chai';
import util from 'util';
import {
  nanoid,
} from 'nanoid';
import {
  resolve,
} from 'path';
import {
  LibFileIndex,
} from '../LibFileIndex.mjs';

const debuglog = util.debuglog('LibFileIndex:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

// FIXME: remove this line when code is ready to have it merged automatically on github

describe('LibFileIndex', () => {
  const LibFileIndexConfig = Object.freeze({
    cwd: resolve(process.cwd(), './specs/cwd'),
  });
  let libFileIndex = null;

  before(async () => {
    libFileIndex = new LibFileIndex(LibFileIndexConfig);

    return libFileIndex.start();
  });

  after(async () => {
    await libFileIndex.stop();
  });

  it('should start/stop the LibFileIndex', async () => {
    expect(libFileIndex.files).is.frozen;
  });

  it('should verify if a file does exist', async () => {
    const relativeFilePath = '/questionnaire.json';
    const fileExists = await libFileIndex.fileExists(relativeFilePath);

    expect(fileExists).to.be.true;
  });

  it('fileExists should return false if a file does not exist', async () => {
    const relativeFilePath = `/${nanoid(5)}.${nanoid(3)}`;
    const fileExists = await libFileIndex.fileExists(relativeFilePath);

    expect(fileExists).to.be.false;
  });

  it('fileExists should return false if a file isDirectory', async () => {
    const relativeFilePath = '/a';
    const fileExists = await libFileIndex.fileExists(relativeFilePath);

    expect(fileExists).to.be.false;
  });

  it('fileExists should throw on undefined path parameter', async () => {
    const relativeFilePath = null;
    let error = null;

    try {
      await libFileIndex.fileExists(relativeFilePath);
    } catch (referenceError) {
      error = referenceError;
    }

    expect(error).to.be.an.instanceof(ReferenceError);
  });
});
