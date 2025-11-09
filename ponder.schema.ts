import { onchainTable } from "ponder";

export const LiquidationCall = onchainTable("LiquidationCall", (t) => ({
  id: t.text().primaryKey(),
  user: t.hex(),
  liquidator: t.hex(),
  collateral_asset: t.hex(),
  debt_asset: t.hex(),
  debt_to_cover: t.bigint(),
  liquidated_collateral_amount: t.bigint(),
  block_timestamp: t.integer(),
  block_number: t.bigint(),
  transaction_hash: t.hex(),
  analysis_status: t.text().default('PENDING'), // PENDING, COMPLETE, FAILED
  first_liquidatable_block: t.bigint(),
  first_liquidatable_timestamp: t.integer(), // Unix timestamp
  latency_seconds: t.integer(),
  blocks_liquidatable: t.integer(),
}));
