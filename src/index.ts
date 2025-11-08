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
    collateralAsset: args.collateralAsset,
    debtAsset: args.debtAsset,
    debtToCover: args.debtToCover,
    liquidatedCollateralAmount: args.liquidatedCollateralAmount,
    blockTimestamp: Number(event.block.timestamp),
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
    analysisStatus: 'PENDING'
  });
  console.log(`Block ${event.block.number}} indexed`)
});