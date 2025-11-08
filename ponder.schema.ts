import { onchainTable } from "ponder";

export const LiquidationCall = onchainTable("LiquidationCall", (t) => ({
  id: t.text().primaryKey(),
  user: t.hex(),
  liquidator: t.hex(),
  collateralAsset: t.hex(),
  debtAsset: t.hex(),
  debtToCover: t.bigint(),
  liquidatedCollateralAmount: t.bigint(),
  blockTimestamp: t.integer(), 
  blockNumber: t.bigint(),
  transactionHash: t.hex(),
    analysisStatus: t.text().default('PENDING'), // PENDING, COMPLETED, FAILED
  firstLiquidatableBlock: t.bigint(),
  firstLiquidatableTime: t.integer(), // Unix timestamp
  timeLiquidatableSeconds: t.integer(),
  blocksLiquidatable: t.integer(),
}));
