import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import makeBlockie from 'ethereum-blockies-base64';

import { useLiquidations } from '../../../hooks/useLiquidations';
import ErrorMessage from '../../common/ErrorMessage';
import { TableSkeleton } from '../../common/SkeletonLoader';
import TableFilters from './TableFilters';
import TokenIcon from './TokenIcon';
import { formatUsd, formatTokenAmount, calculateTokenAmount } from '../../../utils/formatters';
import { API_MAX_LIMIT, PAGINATION_OPTIONS, DEFAULT_ROWS_PER_PAGE } from '../../../constants';
import type { LiquidationData } from '../../../types';
import type { Order, SortableColumn } from './types';

interface LiquidationsTableProps {
  minBonusThreshold: number;
}

const userColumn = (value: string) => (
  <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <img className="blockie-icon" src={makeBlockie(value)} alt="" />
    {value.slice(0, 6)}...{value.slice(-4)}
  </Box>
);

const renderTokenAmount = (
  rawAmount: string,
  tokenAddress: string,
  tokenDecimals: number | null,
  tokenPrice: number | null
) => {
  if (tokenDecimals == null || tokenPrice == null) {
    return <span style={{ color: 'var(--color-text-secondary)' }}>...</span>;
  }
  const { humanAmount, usdValue } = calculateTokenAmount(rawAmount, tokenDecimals, tokenPrice);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TokenIcon tokenAddress={tokenAddress} />
        <span style={{ color: 'var(--color-text)' }}>{formatTokenAmount(humanAmount)}</span>
      </Box>
      <Typography
        sx={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' , paddingLeft: '32px' }}
      >
        {formatUsd(usdValue)}
      </Typography>
    </Box>
  );
};

const calculateBonus = (row: LiquidationData) => {
  const { usdValue: collateralUsd } = calculateTokenAmount(
    row.liquidated_collateral_amount,
    row.collateral_decimals,
    row.collateral_price_usd
  );
  const { usdValue: debtUsd } = calculateTokenAmount(
    row.debt_to_cover,
    row.debt_decimals,
    row.debt_price_usd
  );
  return collateralUsd - debtUsd;
};

export default function LiquidationsTable({ minBonusThreshold }: LiquidationsTableProps) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(DEFAULT_ROWS_PER_PAGE);
  const [orderBy, setOrderBy] = React.useState<SortableColumn>('block_timestamp');
  const [order, setOrder] = React.useState<Order>('desc');
  const [collateralFilter, setCollateralFilter] = React.useState<string | null>(null);
  const [debtFilter, setDebtFilter] = React.useState<string | null>(null);
  const [walletFilter, setWalletFilter] = React.useState('');
  const queryClient = useQueryClient();

  const { liquidations: allLiquidations, isLoading, error } = useLiquidations(API_MAX_LIMIT, 0);

  React.useEffect(() => {
    setPage(0);
  }, [minBonusThreshold, collateralFilter, debtFilter, walletFilter]);

  const thresholdFilteredData = React.useMemo(() => {
    return allLiquidations.filter((liq: LiquidationData) => {
      const bonus = calculateBonus(liq);
      return bonus >= minBonusThreshold;
    });
  }, [allLiquidations, minBonusThreshold]);

  const collateralAssets = React.useMemo(() => {
    const assets = new Set<string>();
    thresholdFilteredData.forEach((liq: LiquidationData) => {
      if (liq.collateral_symbol) assets.add(liq.collateral_symbol);
    });
    return Array.from(assets).sort();
  }, [thresholdFilteredData]);

  const debtAssets = React.useMemo(() => {
    const assets = new Set<string>();
    thresholdFilteredData.forEach((liq: LiquidationData) => {
      if (liq.debt_symbol) assets.add(liq.debt_symbol);
    });
    return Array.from(assets).sort();
  }, [thresholdFilteredData]);

  const filteredAndSortedData = React.useMemo(() => {
    let filtered = allLiquidations.filter((row: LiquidationData) => {
      const bonus = calculateBonus(row);
      if (bonus < minBonusThreshold) return false;

      if (collateralFilter && row.collateral_symbol !== collateralFilter) return false;

      if (debtFilter && row.debt_symbol !== debtFilter) return false;

      if (walletFilter) {
        const lowerWallet = walletFilter.toLowerCase();
        if (
          !row.user.toLowerCase().includes(lowerWallet) &&
          !row.liquidator.toLowerCase().includes(lowerWallet)
        ) {
          return false;
        }
      }

      return true;
    });

    filtered.sort((a: LiquidationData, b: LiquidationData) => {
      let aVal: number, bVal: number;

      switch (orderBy) {
        case 'block_timestamp':
          aVal = a.block_timestamp;
          bVal = b.block_timestamp;
          break;
        case 'liquidation_bonus':
          aVal = calculateBonus(a);
          bVal = calculateBonus(b);
          break;
        case 'liquidated_collateral_amount':
          aVal = calculateTokenAmount(
            a.liquidated_collateral_amount,
            a.collateral_decimals,
            a.collateral_price_usd
          ).usdValue;
          bVal = calculateTokenAmount(
            b.liquidated_collateral_amount,
            b.collateral_decimals,
            b.collateral_price_usd
          ).usdValue;
          break;
        case 'debt_to_cover':
          aVal = calculateTokenAmount(a.debt_to_cover, a.debt_decimals, a.debt_price_usd).usdValue;
          bVal = calculateTokenAmount(b.debt_to_cover, b.debt_decimals, b.debt_price_usd).usdValue;
          break;
        default:
          return 0;
      }

      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [allLiquidations, minBonusThreshold, collateralFilter, debtFilter, walletFilter, orderBy, order]);

  const paginatedData = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleRequestSort = (property: SortableColumn) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Liquidations"
        message={error.message}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['liquidations'] })}
      />
    );
  }

  return (
    <>
      <TableFilters
        collateralFilter={collateralFilter}
        debtFilter={debtFilter}
        walletFilter={walletFilter}
        collateralAssets={collateralAssets}
        debtAssets={debtAssets}
        onCollateralChange={setCollateralFilter}
        onDebtChange={setDebtFilter}
        onWalletChange={setWalletFilter}
      />

      <Paper
        className="glass-border"
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'transparent',
        }}
      >
        <TableContainer>
          <Table sx={{ overflow: 'hidden' }} stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    minWidth: 120,
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bg-card)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  Wallet
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 60,
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bg-card)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'liquidated_collateral_amount'}
                    direction={orderBy === 'liquidated_collateral_amount' ? order : 'asc'}
                    onClick={() => handleRequestSort('liquidated_collateral_amount')}
                    IconComponent={() =>
                      orderBy === 'liquidated_collateral_amount' ? (
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
                    Collateral Liquidated
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 120,
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bg-card)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'debt_to_cover'}
                    direction={orderBy === 'debt_to_cover' ? order : 'asc'}
                    onClick={() => handleRequestSort('debt_to_cover')}
                    IconComponent={() =>
                      orderBy === 'debt_to_cover' ? (
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
                    Debt Repaid
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 120,
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
                    minWidth: 150,
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bg-card)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'liquidation_bonus'}
                    direction={orderBy === 'liquidation_bonus' ? order : 'asc'}
                    onClick={() => handleRequestSort('liquidation_bonus')}
                    IconComponent={() =>
                      orderBy === 'liquidation_bonus' ? (
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
                    Liquidation Bonus
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 170,
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bg-card)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'block_timestamp'}
                    direction={orderBy === 'block_timestamp' ? order : 'asc'}
                    onClick={() => handleRequestSort('block_timestamp')}
                    IconComponent={() =>
                      orderBy === 'block_timestamp' ? (
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
                    Time
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row: LiquidationData) => {
                const bonusUsd = calculateBonus(row);
                return (
                  <TableRow
                    sx={{
                      maxHeight: 440,
                      backgroundColor: 'var(--color-bg-row)',
                    }}
                    tabIndex={-1}
                    key={row.id}
                  >
                    <TableCell
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: 'var(--color-text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      {userColumn(row.user)}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      {renderTokenAmount(
                        row.liquidated_collateral_amount,
                        row.collateral_asset,
                        row.collateral_decimals,
                        row.collateral_price_usd
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      {renderTokenAmount(
                        row.debt_to_cover,
                        row.debt_asset,
                        row.debt_decimals,
                        row.debt_price_usd
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: 'var(--color-text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      {userColumn(row.liquidator)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <Typography
                        sx={{
                          color: 'var(--color-text)',
                          fontFamily: 'var(--font-family-values)',
                        }}
                      >
                        {formatUsd(bonusUsd)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: 'var(--color-text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      {formatDistanceToNow(new Date(row.block_timestamp * 1000), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          sx={{
            backgroundColor: 'var(--color-bg-row)',
            color: 'var(--color-text)',
            borderTop: '1px solid var(--border-color)',
          }}
          rowsPerPageOptions={[...PAGINATION_OPTIONS]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </>
  );
}
