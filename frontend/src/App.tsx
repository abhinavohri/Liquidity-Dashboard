import AnalyticsCard from './components/AnalyticsCard';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LiquidationsTable from './components/LiquidationsTable';
import { PonderProvider } from '@ponder/react';
import { client } from '../lib/ponder';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const queryClient = new QueryClient();

function App() {
  const theme = createTheme({
    typography: {
      fontFamily: ['IBM Plex Sans', 'sans-serif'].join(','),
    },
  });
  return (
    <PonderProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <div className="main-container">
            <h1>Liquidations</h1>
            <Box sx={{ flexGrow: 1, paddingY: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <AnalyticsCard header="# of Liquidations" value="717" />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <AnalyticsCard header="Collateral Liquidated" value="6.79" />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <AnalyticsCard header="Debt Repaid" value="6.17" />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <AnalyticsCard header="Nº of liquidators" value="43" />
                </Grid>
              </Grid>
            </Box>
            <LiquidationsTable />
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    </PonderProvider>
  );
}

export default App;
