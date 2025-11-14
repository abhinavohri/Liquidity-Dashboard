import { createClient } from "@ponder/client";
import * as schema from "../../liquidity-indexer/ponder.schema";

export const client = createClient("http://localhost:42069/sql", { schema });

export { schema };
export const { LiquidationCall } = schema; 