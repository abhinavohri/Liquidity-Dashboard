import { memo, useMemo, useState, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import makeBlockie from 'ethereum-blockies-base64';
import type { LiquidatorStats } from '../../types';
import { formatUsd, formatLatency } from '../../utils/formatters';

interface LiquidatorLeaderboardProps {
  data: LiquidatorStats[];
}

type Order = 'asc' | 'desc';
type SortableColumn = 'totalProfit' | 'avgLatency' | 'count';

function LiquidatorLeaderboard({ data }: LiquidatorLeaderboardProps) {
  const [orderBy, setOrderBy] = useState<SortableColumn>('totalProfit');
  const [order, setOrder] = useState<Order>('desc');

  const handleRequestSort = useCallback((property: SortableColumn) => {
    setOrderBy(prev => {
      const isAsc = prev === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      return property;
    });
  }, [order]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [data, orderBy, order]);

  const topLiquidators = sortedData.slice(0, 10);

  return (
    <Paper
      className="glass-border"
      sx={{
        backgroundColor: 'transparent',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ padding: 2, borderBottom: '1px solid var(--border-color)' }}>
        <Typography variant="h6" sx={{ color: 'var(--color-text)', fontWeight: 600 }}>
          Top Liquidators
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
          Ranked by total profit earned from liquidation bonuses
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-bg-card)',
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                Rank
              </TableCell>
              <TableCell
                sx={{
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-bg-card)',
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                Liquidator
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-bg-card)',
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <TableSortLabel
                  active={orderBy === 'totalProfit'}
                  direction={orderBy === 'totalProfit' ? order : 'asc'}
                  onClick={() => handleRequestSort('totalProfit')}
                  IconComponent={() =>
                    orderBy === 'totalProfit' ? (
                      order === 'desc' ? (
                        <ArrowDownwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, color: 'var(--color-text)' }} />
                      ) : (
                        <ArrowUpwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, color: 'var(--color-text)' }} />
                      )
                    ) : (
                      <ArrowDownwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, opacity: 0.3, color: 'var(--color-text)' }} />
                    )
                  }
                  sx={{ color: 'var(--color-text) !important' }}
                >
                  Total Profit
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-bg-card)',
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <TableSortLabel
                  active={orderBy === 'avgLatency'}
                  direction={orderBy === 'avgLatency' ? order : 'asc'}
                  onClick={() => handleRequestSort('avgLatency')}
                  IconComponent={() =>
                    orderBy === 'avgLatency' ? (
                      order === 'desc' ? (
                        <ArrowDownwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, color: 'var(--color-text)' }} />
                      ) : (
                        <ArrowUpwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, color: 'var(--color-text)' }} />
                      )
                    ) : (
                      <ArrowDownwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, opacity: 0.3, color: 'var(--color-text)' }} />
                    )
                  }
                  sx={{ color: 'var(--color-text) !important' }}
                >
                  Avg Latency
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-bg-card)',
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <TableSortLabel
                  active={orderBy === 'count'}
                  direction={orderBy === 'count' ? order : 'asc'}
                  onClick={() => handleRequestSort('count')}
                  IconComponent={() =>
                    orderBy === 'count' ? (
                      order === 'desc' ? (
                        <ArrowDownwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, color: 'var(--color-text)' }} />
                      ) : (
                        <ArrowUpwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, color: 'var(--color-text)' }} />
                      )
                    ) : (
                      <ArrowDownwardIcon sx={{ fontSize: '1rem', marginLeft: 0.5, opacity: 0.3, color: 'var(--color-text)' }} />
                    )
                  }
                  sx={{ color: 'var(--color-text) !important' }}
                >
                  # Liquidations
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topLiquidators.map((liquidator, index) => (
              <TableRow key={liquidator.liquidator} sx={{ backgroundColor: 'var(--color-bg-row)' }}>
                <TableCell
                  sx={{
                    color: 'var(--color-text)',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '1.1rem',
                    fontWeight: 500,
                  }}
                >
                  #{index + 1}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid var(--border-color)' }}>
                  <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img
                      className="blockie-icon"
                      src={makeBlockie(liquidator.liquidator)}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: '50%' }}
                    />
                    <Typography
                      sx={{
                        color: 'var(--color-text)',
                        fontFamily: 'monospace',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                      }}
                    >
                      {liquidator.liquidator.slice(0, 6)}...{liquidator.liquidator.slice(-4)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: 'var(--color-text)',
                    fontSize: '1.1rem',
                    fontWeight: 500,
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
                    fontSize: '1.1rem',
                    fontWeight: 500,
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
                    fontSize: '1.1rem',
                    fontWeight: 500,
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

export default memo(LiquidatorLeaderboard);
