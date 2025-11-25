import { useState, useCallback } from 'react';
import AnalyticsCard from '../analytics/AnalyticsCard';
import MetricsChart from '../analytics/MetricsChart';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { TimeFilter } from '../../types';
import ErrorMessage from '../common/ErrorMessage';
import { DashboardSkeleton } from '../common/SkeletonLoader';
import { useQueryClient } from '@tanstack/react-query';
import { formatUsd, formatLatency } from '../../utils/formatters';

interface DashboardProps {
  minBonusThreshold: number;
  onViewLiquidators: () => void;
}

function Dashboard({ minBonusThreshold, onViewLiquidators }: DashboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('max');
  const queryClient = useQueryClient();
  const { summary, timeSeriesData, isLoading, error } =
    useAnalytics(timeFilter, minBonusThreshold);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['liquidations', 'all'] });
  }, [queryClient]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Analytics"
        message={error.message}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <>
      <Box sx={{ flexGrow: 1, paddingY: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <AnalyticsCard
              header="# of Liquidations"
              value={summary.totalLiquidations.toString()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <AnalyticsCard
              header="Collateral Liquidated"
              value={formatUsd(summary.totalCollateralUsd)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <AnalyticsCard
              header="Debt Repaid"
              value={formatUsd(summary.totalDebtUsd)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <AnalyticsCard
              header="Avg Latency"
              value={formatLatency(summary.avgLatencySeconds)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <AnalyticsCard
              header="Total Liquidator Profit"
              value={formatUsd(summary.totalLiquidatorProfit)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card
              variant="outlined"
              className="glass-border"
              sx={{
                backgroundColor: 'transparent',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
              onClick={onViewLiquidators}
            >
              <CardContent
                sx={{
                  '&:last-child': { paddingBottom: '0rem' },
                  position: 'relative',
                }}
              >
                <Typography
                  gutterBottom
                  sx={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}
                >
                  N° of liquidators
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography
                    sx={{
                      color: 'var(--color-text)',
                      fontSize: 40,
                      fontFamily: 'var(--font-family-values)',
                    }}
                  >
                    {summary.uniqueLiquidators}
                  </Typography>
                  <IconButton
                    sx={{
                      color: 'var(--color-text-secondary)',
                      '&:hover': { color: 'var(--color-text)' },
                    }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ paddingY: 2 }}>
        <MetricsChart
          data={timeSeriesData}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          isLoading={isLoading}
        />
      </Box>
    </>
  );
}

export default Dashboard;
