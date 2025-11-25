import { useState, useCallback } from 'react';
import AnalyticsCard from '../analytics/AnalyticsCard';
import LiquidatorLeaderboard from '../liquidations/LiquidatorLeaderboard';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { TimeFilter } from '../../types';
import ErrorMessage from '../common/ErrorMessage';
import { DashboardSkeleton } from '../common/SkeletonLoader';
import { useQueryClient } from '@tanstack/react-query';
import { formatUsd, formatLatency } from '../../utils/formatters';

interface LiquidatorsViewProps {
  minBonusThreshold: number;
  onGoBack: () => void;
}

function LiquidatorsView({ minBonusThreshold, onGoBack }: LiquidatorsViewProps) {
  const [timeFilter] = useState<TimeFilter>('max');
  const queryClient = useQueryClient();
  const { summary, liquidatorStats, isLoading, error } = useAnalytics(timeFilter, minBonusThreshold);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['liquidations', 'all'] });
  }, [queryClient]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Liquidators Data"
        message={error.message}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onGoBack}
        sx={{
          color: 'var(--color-text-secondary)',
          marginBottom: 2,
          '&:hover': { color: 'var(--color-text)', backgroundColor: 'rgba(255,255,255,0.05)' },
        }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ flexGrow: 1, paddingY: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AnalyticsCard
              header="Unique Liquidators"
              value={summary.uniqueLiquidators.toString()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AnalyticsCard
              header="Total Liquidator Profit"
              value={formatUsd(summary.totalLiquidatorProfit)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AnalyticsCard
              header="Avg Latency"
              value={formatLatency(summary.avgLatencySeconds)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AnalyticsCard
              header="# of Liquidations"
              value={summary.totalLiquidations.toString()}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ paddingY: 2 }}>
        <LiquidatorLeaderboard data={liquidatorStats} />
      </Box>
    </>
  );
}

export default LiquidatorsView;
