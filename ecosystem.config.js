module.exports = {
  apps: [
    {
      name: "api",
      cwd: "/opt/mrgin/api",
      script: "npx",
      args: "tsx src/index.ts",
      env: { NODE_ENV: "production" },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: "matcher",
      cwd: "/opt/mrgin/matching-engine",
      script: "npx",
      args: "tsx src/index.ts",
      env: { NODE_ENV: "production" },
      restart_delay: 3000,
      max_restarts: 50, // aggressive restart — must not stop
    },
    {
      name: "bots",
      cwd: "/opt/mrgin/bots",
      script: "npx",
      args: "tsx src/index.ts",
      env: { NODE_ENV: "production" },
      restart_delay: 5000,
      max_restarts: 50, // liquidation bot must recover fast
    },
    {
      name: "indexer",
      cwd: "/opt/mrgin/indexer",
      script: "npx",
      args: "tsx src/index.ts",
      env: { NODE_ENV: "production" },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
