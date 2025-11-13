import AnalyticsCard from "./components/AnalyticsCard";
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LiquidationsTable from "./components/LiquidationsTable";

function App() {

  return (
    <>
      <div>
        <h1>Liquidations</h1>
        <Box sx={{ flexGrow: 1, padding: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AnalyticsCard header='# of Liquidations' value="717" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AnalyticsCard header='Collateral Liquidated' value="6.79" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AnalyticsCard header='Debt Repaid' value="6.17" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AnalyticsCard header='Nº of liquidators' value="43" />
            </Grid>
          </Grid>
        </Box>
        <LiquidationsTable />
      </div>
    </>
  )
}

export default App
