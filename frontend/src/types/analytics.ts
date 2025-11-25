export interface AnalyticsSummary {
  avgLatencySeconds: number;
  totalLiquidatorProfit: number;
  totalLiquidations: number;
  totalCollateralUsd: number;
  totalDebtUsd: number;
  uniqueLiquidators: number;
}

export interface TimeSeriesData {
  date: string;
  avgLatency: number;
  count: number;
  totalBonus: number;
  totalDebt: number;
  totalCollateral: number;
}

export interface LiquidatorStats {
  liquidator: string;
  totalProfit: number;
  avgLatency: number;
  count: number;
}

export type TimeFilter = '1w' | '1m' | '1y' | 'max';
