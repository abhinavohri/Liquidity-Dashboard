import { ponder } from "ponder:registry";
import { LiquidationCall } from "ponder:schema";

ponder.on("AaveV3Pool:LiquidationCall", async ({ event, context }) => {
  const { db } = context;
  const { args } = event;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(LiquidationCall).values({
    id: id,
    user: args.user,
    liquidator: args.liquidator,
    collateral_asset: args.collateralAsset,
    debt_asset: args.debtAsset,
    // Convert BigInt to string to preserve precision
    debt_to_cover: args.debtToCover.toString(),
    liquidated_collateral_amount: args.liquidatedCollateralAmount.toString(),
    block_timestamp: Number(event.block.timestamp),
    block_number: event.block.number,
    transaction_hash: event.transaction.hash,
    analysis_status: 'PENDING'
  });
  console.log(`Block ${event.block.number}} indexed`)
});