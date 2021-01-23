import util from 'util';
import {
  // eslint-disable-next-line no-unused-vars
  LibTokenFactory,
} from '@dmitry-n-medvedev/libtokenfactory/LibTokenFactory.mjs';

export class LibTokenServer {
  #debuglog = null;
  #config = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#config = Object.freeze({ ...config });
    this.#debuglog = util.debuglog(this.constructor.name);
  }

  // FIXME: rm next line
  // eslint-disable-next-line class-methods-use-this
  async start() {
    throw new Error('not implemented yet');
  }

  // FIXME: rm next line
  // eslint-disable-next-line class-methods-use-this
  async stop() {
    throw new Error('not implemented yet');
  }
}
