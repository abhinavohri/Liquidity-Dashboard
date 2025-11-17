import { useState, useEffect, useMemo } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface LiquidationData {
  id: string;
  user: string;
  liquidator: string;
  collateral_asset: string;
  debt_asset: string;
  debt_to_cover: string;
  liquidated_collateral_amount: string;
  block_timestamp: number;
  block_number: string;
  transaction_hash: string;
  analysis_status: string;
  first_liquidatable_block: string | null;
  first_liquidatable_time: string | null;
  latency_seconds: number | null;
  blocks_liquidatable: string | null;
  collateral_symbol: string | null;
  collateral_decimals: number | null;
  collateral_price_usd: number | null;
  debt_symbol: string | null;
  debt_decimals: number | null;
  debt_price_usd: number | null;
}

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

const calculateTokenAmount = (
  rawAmount: string,
  tokenDecimals: number | null,
  tokenPrice: number | null
) => {
  if (tokenDecimals == null || tokenPrice == null) {
    return { humanAmount: 0, usdValue: 0 };
  }
  const rawBigInt = BigInt(rawAmount);
  const divisor = BigInt(10 ** tokenDecimals);
  const wholePart = rawBigInt / divisor;
  const remainder = rawBigInt % divisor;
  const humanAmount = Number(wholePart) + Number(remainder) / Number(divisor);
  const usdValue = humanAmount * tokenPrice;
  return { humanAmount, usdValue };
};

const getFilterCutoff = (filter: TimeFilter): number => {
  const now = Date.now();
  switch (filter) {
    case '1w':
      return now - 7 * 24 * 60 * 60 * 1000;
    case '1m':
      return now - 30 * 24 * 60 * 60 * 1000;
    case '1y':
      return now - 365 * 24 * 60 * 60 * 1000;
    case 'max':
      return 0;
  }
};

export function useAnalytics(timeFilter: TimeFilter = 'max', minBonusThreshold: number = 0) {
  const [allData, setAllData] = useState<LiquidationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllLiquidations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/liquidations?limit=10000&offset=0`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setAllData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllLiquidations();
  }, []);

  const analytics = useMemo(() => {
    if (!allData || allData.length === 0) {
      return {
        summary: {
          avgLatencySeconds: 0,
          totalLiquidatorProfit: 0,
          totalLiquidations: 0,
          totalCollateralUsd: 0,
          totalDebtUsd: 0,
          uniqueLiquidators: 0,
        } as AnalyticsSummary,
        timeSeriesData: [] as TimeSeriesData[],
        liquidatorStats: [] as LiquidatorStats[],
      };
    }

    const cutoffTime = getFilterCutoff(timeFilter);

    // Filter by time and minimum bonus threshold
    const filteredData = allData.filter(liq => {
      if (liq.block_timestamp * 1000 < cutoffTime) return false;

      const { usdValue: collateralUsd } = calculateTokenAmount(
        liq.liquidated_collateral_amount,
        liq.collateral_decimals,
        liq.collateral_price_usd
      );
      const { usdValue: debtUsd } = calculateTokenAmount(
        liq.debt_to_cover,
        liq.debt_decimals,
        liq.debt_price_usd
      );
      const bonus = collateralUsd - debtUsd;

      return bonus >= minBonusThreshold;
    });

    let totalLatency = 0;
    let latencyCount = 0;
    let totalProfit = 0;
    let totalCollateralUsd = 0;
    let totalDebtUsd = 0;
    const uniqueLiquidators = new Set<string>();

    const dateMap = new Map<
      string,
      {
        totalLatency: number;
        latencyCount: number;
        count: number;
        totalBonus: number;
        totalDebt: number;
        totalCollateral: number;
      }
    >();

    const liquidatorMap = new Map<
      string,
      { totalProfit: number; totalLatency: number; latencyCount: number; count: number }
    >();

    for (const liq of filteredData) {
      const { usdValue: collateralUsd } = calculateTokenAmount(
        liq.liquidated_collateral_amount,
        liq.collateral_decimals,
        liq.collateral_price_usd
      );
      const { usdValue: debtUsd } = calculateTokenAmount(
        liq.debt_to_cover,
        liq.debt_decimals,
        liq.debt_price_usd
      );
      const profit = collateralUsd - debtUsd;

      totalCollateralUsd += collateralUsd;
      totalDebtUsd += debtUsd;
      totalProfit += profit;
      uniqueLiquidators.add(liq.liquidator);

      if (liq.latency_seconds != null && liq.latency_seconds >= 0) {
        totalLatency += liq.latency_seconds;
        latencyCount++;
      }

      const date = new Date(liq.block_timestamp * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || {
        totalLatency: 0,
        latencyCount: 0,
        count: 0,
        totalBonus: 0,
        totalDebt: 0,
        totalCollateral: 0,
      };
      existing.count++;
      existing.totalBonus += profit;
      existing.totalDebt += debtUsd;
      existing.totalCollateral += collateralUsd;
      if (liq.latency_seconds != null && liq.latency_seconds >= 0) {
        existing.totalLatency += liq.latency_seconds;
        existing.latencyCount++;
      }
      dateMap.set(dateKey, existing);

      const liquidatorData = liquidatorMap.get(liq.liquidator) || {
        totalProfit: 0,
        totalLatency: 0,
        latencyCount: 0,
        count: 0,
      };
      liquidatorData.totalProfit += profit;
      liquidatorData.count++;
      if (liq.latency_seconds != null && liq.latency_seconds >= 0) {
        liquidatorData.totalLatency += liq.latency_seconds;
        liquidatorData.latencyCount++;
      }
      liquidatorMap.set(liq.liquidator, liquidatorData);
    }

    const summary: AnalyticsSummary = {
      avgLatencySeconds: latencyCount > 0 ? totalLatency / latencyCount : 0,
      totalLiquidatorProfit: totalProfit,
      totalLiquidations: filteredData.length,
      totalCollateralUsd,
      totalDebtUsd,
      uniqueLiquidators: uniqueLiquidators.size,
    };

    const timeSeriesData: TimeSeriesData[] = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        avgLatency: data.latencyCount > 0 ? data.totalLatency / data.latencyCount : 0,
        count: data.count,
        totalBonus: data.totalBonus,
        totalDebt: data.totalDebt,
        totalCollateral: data.totalCollateral,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const liquidatorStats: LiquidatorStats[] = Array.from(liquidatorMap.entries())
      .map(([liquidator, data]) => ({
        liquidator,
        totalProfit: data.totalProfit,
        avgLatency: data.latencyCount > 0 ? data.totalLatency / data.latencyCount : 0,
        count: data.count,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit);

    return {
      summary,
      timeSeriesData,
      liquidatorStats,
    };
  }, [allData, timeFilter, minBonusThreshold]);

  return {
    ...analytics,
    isLoading,
    error,
  };
}
