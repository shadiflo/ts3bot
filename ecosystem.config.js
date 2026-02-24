module.exports = {
  apps: [
    {
      name: "ts3bot",
      script: "dist/index.js",
      cwd: __dirname,
      env_file: ".env",
      restart_delay: 5000,
      max_restarts: 10,
      autorestart: true,
    },
  ],
};
