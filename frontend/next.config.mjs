
export default {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    NEXT_PUBLIC_RPC: process.env.NEXT_PUBLIC_RPC ?? "https://api.devnet.solana.com",
    NEXT_PUBLIC_PERP_ENGINE_ID: process.env.NEXT_PUBLIC_PERP_ENGINE_ID ?? "FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB",
    NEXT_PUBLIC_MARKET_ADDRESS: process.env.NEXT_PUBLIC_MARKET_ADDRESS ?? "FG2Ggfmyxt6LfzHXXZbBfMy35Z2HaKuBQFA8o3aCBPZQ",
  },
};
