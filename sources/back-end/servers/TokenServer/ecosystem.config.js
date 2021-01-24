module.exports = {
  apps: [
    {
      name: 'token server',
      script: './index.mjs',
      instances: 1,
      exec_mode: 'cluster',
      // increment_var: 'UWS_PORT',
      time: true,
      combine_logs: true,
      env: {
        NODE_ENV: 'development',
        NODE_DEBUG: 'Lib*,Token*',
        REDIS_HOST: 'redis-server',
        REDIS_PORT: 6379,
        UWS_PORT: 80,
      },
      watch: false,
    },
  ],
};
