import util from 'util';
import dotenv from 'dotenv';
import {
  LibAuthServer,
} from '@dmitry-n-medvedev/libauthserver';

const debuglog = util.debuglog('AuthServer');
let libAuthServer = null;

const handleShutdownSignal = async (signal) => {
  debuglog('handleShutdownSignal', signal);

  process.removeAllListeners();

  if (libAuthServer !== null) {
    try {
      await libAuthServer.stop();
    } catch (anyError) {
      debuglog(anyError.message);
    } finally {
      libAuthServer = null;
    }
  }
  // eslint-disable-next-line no-process-exit
  process.exit(0);
};

process.on('SIGINT', handleShutdownSignal);
process.on('SIGTERM', handleShutdownSignal);
process.on('SIGHUP', handleShutdownSignal);
process.on('uncaughtException', handleShutdownSignal);
process.on('unhandledRejection', handleShutdownSignal);

(async () => {
  debuglog('starting...');

  dotenv.config();

  const LibAuthServerConfig = Object.freeze({
    port: parseInt(process.env.UWS_PORT, 10) || null,
    redis: {
      host: process.env.REDIS_HOST || null,
      port: parseInt(process.env.REDIS_PORT, 10) || null,
    },
  });

  debuglog('LibAuthServerConfig:', LibAuthServerConfig);

  libAuthServer = new LibAuthServer(LibAuthServerConfig);

  await libAuthServer.start();
})();
