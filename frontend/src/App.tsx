import { useState } from 'react';
import AnalyticsCard from './components/AnalyticsCard';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LiquidationsTable from './components/LiquidationsTable';
import MetricsChart from './components/MetricsChart';
import LiquidatorLeaderboard from './components/LiquidatorLeaderboard';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAnalytics, type TimeFilter } from './hooks/useAnalytics';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import numbro from 'numbro';

const formatUsd = (value: number) => {
  if (value === 0) return <><span style={{ color: '#808080' }}>$</span>0</>;
  const formatted = numbro(value).format({
    average: true,
    totalLength: 4,
    mantissa: 2,
  });
  // Extract number and suffix, capitalize suffix
  const match = formatted.match(/^([\d.]+)([a-z]*)$/i);
  if (match) {
    const [, num, suffix] = match;
    const upperSuffix = suffix.toUpperCase();
    return (
      <>
        <span style={{ color: '#808080' }}>$</span>
        {num}
        {upperSuffix && <span style={{ color: '#808080' }}>{upperSuffix}</span>}
      </>
    );
  }
  return <><span style={{ color: '#808080' }}>$</span>{formatted}</>;
};

const formatLatency = (seconds: number) => {
  if (seconds < 60) {
    return (
      <>
        {seconds.toFixed(1)}
        <span style={{ color: '#808080' }}>s</span>
      </>
    );
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return (
      <>
        {minutes.toFixed(1)}
        <span style={{ color: '#808080' }}>min</span>
      </>
    );
  }
  const hours = minutes / 60;
  return (
    <>
      {hours.toFixed(1)}
      <span style={{ color: '#808080' }}>h</span>
    </>
  );
};

interface DashboardProps {
  minBonusThreshold: number;
  onViewLiquidators: () => void;
}

function Dashboard({ minBonusThreshold, onViewLiquidators }: DashboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('max');
  const { summary, timeSeriesData, isLoading, error } =
    useAnalytics(timeFilter, minBonusThreshold);

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
        />
      </Box>
    </>
  );
}

interface LiquidatorsViewProps {
  minBonusThreshold: number;
  onGoBack: () => void;
}

function LiquidatorsView({ minBonusThreshold, onGoBack }: LiquidatorsViewProps) {
  const [timeFilter] = useState<TimeFilter>('max');
  const { summary, liquidatorStats, isLoading, error } = useAnalytics(timeFilter, minBonusThreshold);

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

function App() {
  const [minBonusThreshold, setMinBonusThreshold] = useState(100);
  const [view, setView] = useState<'main' | 'liquidators'>('main');
  const [selectedChain, setSelectedChain] = useState('Aave');
  const [chainAnchorEl, setChainAnchorEl] = useState<null | HTMLElement>(null);

  const chains = ['Aave'];

  const theme = createTheme({
    typography: {
      fontFamily: ['IBM Plex Sans', 'sans-serif'].join(','),
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <div className="main-container">
        <h1 style={{ marginBottom: '1rem' }}>Liquidations</h1>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginBottom: 3,
          }}
        >
          <Button
            onClick={e => setChainAnchorEl(e.currentTarget)}
            endIcon={<ArrowForwardIcon sx={{ transform: 'rotate(90deg)', fontSize: '1rem' }} />}
            sx={{
              backgroundColor: 'var(--color-bg-row)',
              color: 'var(--color-text)',
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'var(--color-text-secondary)',
              },
            }}
          >
            {selectedChain}
          </Button>
          <Menu
            anchorEl={chainAnchorEl}
            open={Boolean(chainAnchorEl)}
            onClose={() => setChainAnchorEl(null)}
            PaperProps={{
              sx: {
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              },
            }}
          >
            {chains.map(chain => (
              <MenuItem
                key={chain}
                onClick={() => {
                  setSelectedChain(chain);
                  setChainAnchorEl(null);
                }}
                selected={selectedChain === chain}
                sx={{
                  color: 'var(--color-text)',
                  '&:hover': { backgroundColor: 'var(--color-bg-row)' },
                  '&.Mui-selected': { backgroundColor: 'rgba(0,188,212,0.2)' },
                }}
              >
                {chain}
              </MenuItem>
            ))}
          </Menu>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backgroundColor: 'var(--color-bg-row)',
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Typography sx={{ color: 'var(--color-text)', fontWeight: 500, fontSize: '1rem' }}>
              Minimum Bonus Threshold:
            </Typography>
            <TextField
              type="number"
              size="small"
              value={minBonusThreshold}
              onChange={e => setMinBonusThreshold(Number(e.target.value) || 0)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ marginRight: 0 }}>
                    $
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 140,
                '& .MuiOutlinedInput-root': {
                  color: 'var(--color-text)',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '& fieldset': { borderColor: 'var(--border-color)' },
                  '&:hover fieldset': { borderColor: 'var(--color-text-secondary)' },
                  '&.Mui-focused fieldset': { borderColor: '#00bcd4' },
                },
                '& .MuiInputAdornment-root': {
                  color: 'var(--color-text)',
                  '& p': { color: 'var(--color-text)', fontWeight: 600, fontSize: '1.1rem' },
                },
                '& input': { padding: '10px 14px' },
              }}
            />
          </Box>
        </Box>

        {view === 'main' ? (
          <>
            <Dashboard
              minBonusThreshold={minBonusThreshold}
              onViewLiquidators={() => setView('liquidators')}
            />
            <LiquidationsTable minBonusThreshold={minBonusThreshold} />
          </>
        ) : (
          <LiquidatorsView minBonusThreshold={minBonusThreshold} onGoBack={() => setView('main')} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
