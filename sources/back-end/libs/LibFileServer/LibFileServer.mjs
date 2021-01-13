import util from 'util';
import fs from 'fs';
import {
  join,
  resolve,
} from 'path';

export class LibFileServer {
  #debuglog = null;
  #config = null;
  #fileList = null;
  #basePathLength = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    // FIXME: should use ajv
    if (Object.keys(config).length === 0) {
      throw new TypeError('config is empty');
    }

    if (Object.keys(config).includes('cwd') === false) {
      throw new TypeError('config.cwd is undefined');
    }

    this.#debuglog = util.debuglog('LibFileServer');
    this.#fileList = new Set();

    this.#config = Object.freeze({ ...config });
    this.#basePathLength = resolve(this.#config.cwd).length;
  }

  get files() {
    const result = [];

    for (const file of this.#fileList.values()) {
      result.push(file);
    }

    return Object.freeze(result);
  }

  // eslint-disable-next-line func-names
  #addFileToFileList (filePath = null) {
    if (filePath === null) {
      throw new ReferenceError('filePath is undefined');
    }

    this.#fileList.add(filePath.slice(this.#basePathLength));
  }

  // eslint-disable-next-line func-names
  async #traverseWorkingDirectory (workingDirectory = null) {
    if (workingDirectory === null) {
      throw new ReferenceError('workingDirectory is undefined');
    }

    const files = await fs.promises.readdir(workingDirectory, { withFileTypes: true });

    for await (const file of files) {
      const joinedPath = join(workingDirectory, file.name);

      if (file.isDirectory() === true) {
        await this.#traverseWorkingDirectory(joinedPath);
      }

      if (file.isFile() === true) {
        this.#addFileToFileList(joinedPath);
      }
    }

    return Promise.resolve();
  }

  async start() {
    await this.#traverseWorkingDirectory(this.#config.cwd);
  }

  async stop() {
    this.#fileList.clear();
    this.#fileList = null;
    this.#config = null;
    this.#debuglog = null;
  }
}
