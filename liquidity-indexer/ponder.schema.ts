import { onchainTable } from "ponder";

export const LiquidationCall = onchainTable("LiquidationCall", (t) => ({
  id: t.text().primaryKey(),
  user_address: t.hex(),
  liquidator: t.hex(),
  collateral_asset: t.hex(),
  debt_asset: t.hex(),
  debt_to_cover: t.text(),
  liquidated_collateral_amount: t.text(),
  block_timestamp: t.integer(),
  block_number: t.bigint(),
  tx_hash: t.hex(),
}));
