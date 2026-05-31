
export default {
  reactStrictMode: true,
  // Keep the Postgres driver out of the webpack bundle (loaded at runtime in Node).
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    NEXT_PUBLIC_RPC: process.env.NEXT_PUBLIC_RPC ?? "https://api.devnet.solana.com",
    NEXT_PUBLIC_PERP_ENGINE_ID: process.env.NEXT_PUBLIC_PERP_ENGINE_ID ?? "FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB",
    NEXT_PUBLIC_MARKET_ADDRESS: process.env.NEXT_PUBLIC_MARKET_ADDRESS ?? "3hEaxT34TiUd7tBHPyNXW8HEfvPAWmLWxAVZijXjx9qD",
    NEXT_PUBLIC_CROSS_MARGIN_ID: process.env.NEXT_PUBLIC_CROSS_MARGIN_ID ?? "2Khz6Ehrexn5Eou1SR72UT1XGyAmv5cmAkqCYT24UDDm",
    NEXT_PUBLIC_USDC_MINT: process.env.NEXT_PUBLIC_USDC_MINT ?? "6h89qqoyzwvwGQLJ5SvWVQBuQtvFmzaGVqdMXo4K9k19",
  },
};
