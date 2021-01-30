import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import got from 'got';
import {
  LibOfferServer,
} from '../LibOfferServer.mjs';

const debuglog = util.debuglog('LibOfferServer:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibOfferServer', () => {
  const LibOfferServerConfig = Object.freeze({
    port: 9090,
  });
  let libOfferServer = null;
  let client = null;

  before(async () => {
    libOfferServer = new LibOfferServer(LibOfferServerConfig);

    await libOfferServer.start();

    client = got.extend({
      prefixUrl: `http://localhost:${LibOfferServerConfig.port}`,
    });
  });

  after(async () => {
    client = null;

    await libOfferServer.stop();

    libOfferServer = null;
  });

  it.only('should get an offer', async () => {

  });
});
