module.exports = {
  apps: [
    {
      name: 'token server',
      script: './index.mjs',
      instances: 1,
      exec_mode: 'cluster',
      time: true,
      combine_logs: true,
      env: {
        NODE_ENV: 'development',
        NODE_DEBUG: 'Lib*,Token*',
        CONTEXT: 'featheri',
        REDIS_HOST: 'redis-server',
        REDIS_PORT: 6379,
        TTL: 500,
        UWS_PORT: 9091,
      },
      watch: false,
    },
  ],
};
