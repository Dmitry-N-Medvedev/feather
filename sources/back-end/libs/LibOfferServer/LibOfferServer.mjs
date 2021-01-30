import util from 'util';
import uWS from 'uWebSockets.js';

const offers = Object.freeze([
  {
    title: 'needed',
    options: [
      {
        title: 'personal liability',
        provider: 'coya',
        price: 4.99,
        urls: {
          info: 'https://app.feather-insurance.com/recommendations/liability',
          buy: 'https://app.feather-insurance.com/policies/liability',
        },
        description: `You need personal liability insurance in Germany.
          If you ever damage someone or something (even accidentally) without personal liability insurance
          you can end up paying for all the costs for the rest of your life. This insurance will cover you in case of such claims.`,
      },
      {
        title: 'life',
        provider: 'community life',
        price: 20.00,
        urls: {
          info: 'https://app.feather-insurance.com/recommendations/life',
          // eslint-disable-next-line max-len
          buy: 'https://www.communitylife.de/versicherungen/risikolebensversicherung?PartnerID=getpopsure&utm_source=getpopsure&utm_medium=kooperation&utm_campaign=getpopsure-rlv',
        },
        description: `You need life insurance as people depend on you.
        If you die, the life insurance will cover the cost of living for the people depending on you (kids, spouse, ...).`,
      },
      {
        title: 'health (public)',
        provider: 'techniker krankenkasse',
        price: 20.00,
        urls: {
          info: 'https://app.feather-insurance.com/recommendations/public_health',
          buy: 'https://www.signuptk.de/?source=popsure',
        },
        description: `Public health insurance is required for you.
        You are not qualified to get private insurance. This one is a no-brainer.`,
      },
    ],
  },
]);

const ALL_NET_INTERFACES = '0.0.0.0';

export class LibOfferServer {
  #debuglog = null;
  #handle = null;
  #server = null;
  #config = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#config = Object.freeze({
      ...config,
    });
    this.#debuglog = util.debuglog(this.constructor.name);
  }

  async start() {
    this.#debuglog('.start');

    if (this.#handle !== null) {
      return Promise.resolve();
    }

    this.#server = uWS
      .App({})
      .post('/get-offer', async (res) => {
        res.onAborted(() => {
          res.aborted = true;
        });

        res.aborted = false;

        if (res.aborted === false) {
          return res.end(JSON.stringify(offers));
        }

        return this;
      })
      .listen(ALL_NET_INTERFACES, this.#config.port, (handle) => {
        this.#debuglog('.listen', ALL_NET_INTERFACES, this.#config.port, handle);

        if (!handle) {
          throw new Error(`failed to listen on port ${this.#config.port}`);
        }

        this.#handle = handle;

        this.#debuglog(`started on port ${this.#config.port}`);
      });

    return Promise.resolve();
  }

  async stop() {
    this.#debuglog('.stop');

    if (this.#handle === null) {
      return Promise.resolve();
    }

    uWS.us_listen_socket_close(this.#handle);

    this.#debuglog(`stopped listening on port: ${this.#config.port}`);

    this.#handle = null;
    this.#server = null;
    this.#debuglog = null;
    this.#config = null;

    return Promise.resolve();
  }
}
