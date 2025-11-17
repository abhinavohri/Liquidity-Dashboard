import { useState } from 'react';
import AnalyticsCard from './components/AnalyticsCard';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LiquidationsTable from './components/LiquidationsTable';
import MetricsChart from './components/MetricsChart';
import LiquidatorLeaderboard from './components/LiquidatorLeaderboard';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAnalytics, type TimeFilter } from './hooks/useAnalytics';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import numbro from 'numbro';

const formatUsd = (value: number) => {
  if (value === 0) return '$0';
  return numbro(value).format({
    average: true,
    totalLength: 4,
    mantissa: 2,
    prefix: '$',
  });
};

const formatLatency = (seconds: number) => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
};

function Dashboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('max');
  const { summary, timeSeriesData, liquidatorStats, isLoading, error } =
    useAnalytics(timeFilter);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ margin: 2 }}>
        Error loading analytics: {error.message}
      </Alert>
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
            <AnalyticsCard
              header="Unique Liquidators"
              value={summary.uniqueLiquidators.toString()}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ paddingY: 2 }}>
        <MetricsChart
          data={timeSeriesData}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
        />
      </Box>

      <Box sx={{ paddingY: 2 }}>
        <LiquidatorLeaderboard data={liquidatorStats} />
      </Box>
    </>
  );
}

function App() {
  const theme = createTheme({
    typography: {
      fontFamily: ['IBM Plex Sans', 'sans-serif'].join(','),
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <div className="main-container">
        <h1>Liquidations</h1>
        <Dashboard />
        <LiquidationsTable />
      </div>
    </ThemeProvider>
  );
}

export default App;
