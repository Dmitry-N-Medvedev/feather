module.exports = {
  apps: [
    {
      name: 'auth server',
      script: './index.mjs',
      instances: 2,
      exec_mode: 'cluster',
      increment_var: 'UWS_PORT',
      time: true,
      combine_logs: true,
      env: {
        NODE_ENV: 'development',
        NODE_DEBUG: 'AuthServer*,LibAuthServer*',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379,
        UWS_PORT: 80,
      },
      env_production: {
        NODE_DEBUG: 'AuthServer*,LibAuthServer*',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379,
        UWS_PORT: 80,
      },
      watch: false,
    },
  ],
};
