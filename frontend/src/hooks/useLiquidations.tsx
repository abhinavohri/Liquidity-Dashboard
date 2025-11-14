import { usePonderQuery } from "@ponder/react";
import { desc } from "@ponder/client";
import { schema } from "../../lib/ponder";

export function useLiquidations(limit: number, offset: number) {
  const query = usePonderQuery({
    queryFn: (db) =>
      db
        .select()
        .from(schema.LiquidationCall as any)
        .orderBy(desc(schema.LiquidationCall.block_timestamp as any))
        .limit(limit)
        .offset(offset),
  });

  const countQuery = usePonderQuery({
    queryFn: (db) => db.$count(schema.LiquidationCall as any),
  });

  return {
    liquidations: query.data || [],
    totalCount: countQuery.data || 0,
    isLoading: query.isLoading || countQuery.isLoading,
    error: query.error || countQuery.error,
  };
}