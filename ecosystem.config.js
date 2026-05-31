const APP_ROOT = process.env.MRGIN_APP_ROOT || "/opt/mrgin/app";

module.exports = {
  apps: [
    {
      name: "api",
      cwd: APP_ROOT,
      script: "npx",
      args: "tsx api/src/index.ts",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: `${APP_ROOT}/.env`,
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: "matcher",
      cwd: APP_ROOT,
      script: "npx",
      args: "tsx matching-engine/src/index.ts",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: `${APP_ROOT}/.env`,
      },
      restart_delay: 3000,
      max_restarts: 50,
    },
    {
      name: "bots",
      cwd: APP_ROOT,
      script: "npx",
      args: "tsx bots/src/index.ts",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: `${APP_ROOT}/.env`,
      },
      restart_delay: 5000,
      max_restarts: 50,
    },
    {
      name: "indexer",
      cwd: APP_ROOT,
      script: "npx",
      args: "tsx indexer/src/index.ts",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: `${APP_ROOT}/.env`,
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
