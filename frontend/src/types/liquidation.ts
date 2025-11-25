export interface LiquidationData {
  id: string;
  user: string;
  liquidator: string;
  collateral_asset: string;
  debt_asset: string;
  debt_to_cover: string;
  liquidated_collateral_amount: string;
  block_timestamp: number;
  latency_seconds: number | null;
  collateral_symbol: string | null;
  collateral_decimals: number | null;
  collateral_price_usd: number | null;
  debt_symbol: string | null;
  debt_decimals: number | null;
  debt_price_usd: number | null;
}

export interface LiquidationsResponse {
  data: LiquidationData[];
  totalCount: number;
  limit: number;
  offset: number;
}
