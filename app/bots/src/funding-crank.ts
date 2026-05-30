import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";

const MARKETS = (process.env.MARKET_ADDRESSES ?? "").split(",").filter(Boolean);
const FUNDING_INTERVAL_MS = 3_600_000; // 1 hour

export async function runFundingCrank(perpProgram: Program<any>, crankerKeypair: Keypair) {
  console.log("[crank] starting — interval: 1h, markets:", MARKETS.length);

  const settle = async () => {
    for (const market of MARKETS) {
      try {
        await (perpProgram as any).methods
          .settleFunding()
          .accounts({ cranker: crankerKeypair.publicKey, market: new PublicKey(market) })
          .rpc();
        console.log(`[crank] funding settled for ${market}`);
      } catch (err: any) {
        // FundingPeriodNotElapsed is expected if called too early
        if (!err.message?.includes("FundingPeriodNotElapsed")) {
          console.error(`[crank] settle failed for ${market}:`, err.message);
        }
      }
    }
  };

  await settle();
  setInterval(settle, FUNDING_INTERVAL_MS);
}
