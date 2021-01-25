import util from 'util';
import got from 'got';
import mocha from 'mocha';
import chai from 'chai';
import dotenv from 'dotenv';
import {
  ActionTypes,
} from '@dmitry-n-medvedev/libtoken/constants/ActionTypes.mjs';
import {
  Locations,
} from '@dmitry-n-medvedev/libcommon/constants/Locations.mjs';

const debuglog = util.debuglog('docker');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

dotenv.config();

describe('Docker', () => {
  const config = Object.freeze({
    tokenServer: {
      host: process.env.TOKEN_SERVER_HOST,
      port: parseInt(process.env.TOKEN_SERVER_PORT, 10),
    },
    fileServer: {
      host: process.env.FILE_SERVER_HOST,
      port: parseInt(process.env.FILE_SERVER_PORT, 10),
    },
  });
  debuglog({ config });
  const urls = Object.freeze({
    tokenServer: `http://${config.tokenServer.host}:${config.tokenServer.port}`,
    fileServer: `http://${config.fileServer.host}:${config.fileServer.port}`,
  });
  debuglog({ urls });
  const questionnaireUrl = 'questionnaires/2479b25e-6980-4208-8de7-2639e14604da.json';
  let client = null;

  before(() => {
    client = got.extend({
      timeout: 250,
      retry: 0,
      throwHttpErrors: false,
    });
  });

  after(() => {
    client = null;
  });

  it.only(`should get the /${questionnaireUrl}`, async () => {
    const forAction = Object.freeze({
      type: ActionTypes.READ,
      object: `/${questionnaireUrl}`,
    });
    const obtainAccountToken = async () => {
      const { body } = await client(`${urls.tokenServer}/account-token`, {});
      const result = (JSON.parse(body)).token;

      debuglog('account token:', result);

      return result;
    };
    const obtainAccessToken = async (accountToken) => {
      const {
        body,
      } = await client.post(`${urls.tokenServer}/access-token`, {
        headers: {
          Authorization: accountToken,
        },
        body: JSON.stringify({
          action: forAction,
          location: Locations.FILE_SERVER,
        }),
      });
      const result = (JSON.parse(body)).token;

      debuglog('access token:', result);

      return result;
    };
    const obtainQuestionnaire = async (accessToken) => {
      const STATUS_CODE_OK = 200;
      const response = await client(`${urls.fileServer}/${questionnaireUrl}`, {
        headers: {
          Authorization: accessToken,
        },
      });
      const {
        body,
      } = response;

      debuglog(response);

      expect(response.statusCode).to.equal(STATUS_CODE_OK);

      const result = JSON.parse(body);

      debuglog('questionnaire:', result);

      return result;
    };

    const accountToken = await obtainAccountToken();
    const accessToken = await obtainAccessToken(accountToken);
    const questionnaire = await obtainQuestionnaire(accessToken);

    expect(questionnaire).to.exist;
  });
});
