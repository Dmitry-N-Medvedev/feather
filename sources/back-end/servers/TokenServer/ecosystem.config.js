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
      },
      watch: false,
    },
  ],
};
