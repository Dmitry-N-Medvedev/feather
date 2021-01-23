import util from 'util';
import dotenv from 'dotenv';
import {
  LibAuthServer,
} from '@dmitry-n-medvedev/libauthserver';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';

process.exitCode = 1;

const debuglog = util.debuglog('AuthServer');
let libAuthServer = null;

const handleShutdownSignal = async (signal) => {
  process.exitCode = 0;

  debuglog('handleShutdownSignal:', signal);

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

const handleUncaughtException = (error) => {
  process.removeAllListeners();

  debuglog('handleUncaughtException:', error);
};

const handleUnhandledRejection = (reason, promise) => {
  process.removeAllListeners();

  debuglog('handleUnhandledRejection at', promise, 'with reason', reason);
};

process.on('SIGINT', handleShutdownSignal);
process.on('SIGTERM', handleShutdownSignal);
process.on('SIGHUP', handleShutdownSignal);
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

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

  libAuthServer = new LibAuthServer(LibAuthServerConfig, new LibRedisAdapter());

  await libAuthServer.start();
})();
