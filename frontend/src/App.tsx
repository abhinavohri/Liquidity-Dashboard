import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import Dashboard from './components/views/Dashboard';
import LiquidatorsView from './components/views/LiquidatorsView';
import LiquidationsTable from './components/liquidations/LiquidationsTable';
import { AVAILABLE_CHAINS } from './constants';

function App() {
  const [minBonusThreshold, setMinBonusThreshold] = useState(0);
  const [view, setView] = useState<'main' | 'liquidators'>('main');
  const [selectedChain, setSelectedChain] = useState(AVAILABLE_CHAINS[0]);
  const [chainAnchorEl, setChainAnchorEl] = useState<null | HTMLElement>(null);

  const theme = createTheme({
    typography: {
      fontFamily: ['IBM Plex Sans', 'sans-serif'].join(','),
    },
  });

  return (
    <ErrorBoundary>
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
              {AVAILABLE_CHAINS.map(chain => (
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
    </ErrorBoundary>
  );
}

export default App;
