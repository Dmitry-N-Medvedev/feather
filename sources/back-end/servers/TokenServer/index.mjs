import util from 'util';
import dotenv from 'dotenv';
import {
  LibTokenServer,
} from '@dmitry-n-medvedev/libtokenserver/LibTokenServer.mjs';

process.exitCode = 1;

const debuglog = util.debuglog('TokenServer');
let libTokenServer = null;

const handleShutdownSignal = async (signal) => {
  process.exitCode = 0;

  debuglog('handleShutdownSignal:', signal);

  process.removeAllListeners();

  if (libTokenServer !== null) {
    try {
      await libTokenServer.stop();
    } catch (anyError) {
      debuglog(anyError.message);
    } finally {
      libTokenServer = null;
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

  const LibTokenServerConfig = Object.freeze({
    token: {
      ctx: process.env.CONTEXT, // ctx must always by 8 characters long
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      ttl: {
        accessToken: process.env.TTL,
      },
    },
    uws: {
      port: process.env.UWS_PORT,
    },
  });

  debuglog('LibTokenServerConfig:', LibTokenServerConfig);

  libTokenServer = new LibTokenServer(LibTokenServerConfig);

  await libTokenServer.start();
})();
