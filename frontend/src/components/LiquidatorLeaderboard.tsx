import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import makeBlockie from 'ethereum-blockies-base64';
import numbro from 'numbro';
import type { LiquidatorStats } from '../hooks/useAnalytics';

interface LiquidatorLeaderboardProps {
  data: LiquidatorStats[];
}

const formatUsd = (value: number) => {
  if (value === 0) {
    return '$0.00';
  }

  return numbro(value).format({
    average: true,
    totalLength: 4,
    mantissa: 2,
    prefix: '$',
  });
};

const formatLatency = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  }
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
};

export default function LiquidatorLeaderboard({
  data,
}: LiquidatorLeaderboardProps) {
  // Show top 10 liquidators
  const topLiquidators = data.slice(0, 10);

  return (
    <Paper
      className="glass-border"
      sx={{
        padding: 2,
        backgroundColor: 'transparent',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Box sx={{ marginBottom: 2 }}>
        <Typography
          variant="h6"
          sx={{ color: 'var(--color-text)', fontWeight: 600 }}
        >
          Top Liquidators
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'var(--color-text-secondary)' }}
        >
          Ranked by total profit earned from liquidation bonuses
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                }}
              >
                Rank
              </TableCell>
              <TableCell
                sx={{
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                }}
              >
                Liquidator
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                }}
              >
                Total Profit
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                }}
              >
                Avg Latency
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                }}
              >
                # Liquidations
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topLiquidators.map((liquidator, index) => (
              <TableRow key={liquidator.liquidator}>
                <TableCell
                  sx={{
                    color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                    fontWeight: 600,
                  }}
                >
                  #{index + 1}
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      className="blockie-icon"
                      src={makeBlockie(liquidator.liquidator)}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: '50%' }}
                    />
                    <Typography
                      sx={{
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {liquidator.liquidator.slice(0, 6)}...
                      {liquidator.liquidator.slice(-4)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: 'var(--color-success)',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border-color)',
                    fontFamily: 'var(--font-family-values)',
                  }}
                >
                  {formatUsd(liquidator.totalProfit)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: 'var(--color-text)',
                    borderBottom: '1px solid var(--border-color)',
                    fontFamily: 'var(--font-family-values)',
                  }}
                >
                  {formatLatency(liquidator.avgLatency)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: 'var(--color-text)',
                    borderBottom: '1px solid var(--border-color)',
                    fontFamily: 'var(--font-family-values)',
                  }}
                >
                  {liquidator.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
