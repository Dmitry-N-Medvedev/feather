module.exports = {
  apps: [
    {
      name: 'auth server',
      script: './index.mjs',
      instances: 1,
      exec_mode: 'cluster',
      // increment_var: 'UWS_PORT',
      time: true,
      combine_logs: true,
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
    },
  ],
};
