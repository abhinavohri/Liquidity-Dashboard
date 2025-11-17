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
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useLiquidations } from '../hooks/useLiquidations';
import makeBlockie from 'ethereum-blockies-base64';
import Typography from '@mui/material/Typography';
import { formatDistanceToNow } from 'date-fns';
import numbro from 'numbro';
import { getAddress } from 'viem';

interface LiquidationCall {
  id: string;
  user: string;
  liquidator: string;
  collateral_asset: string;
  debt_asset: string;
  debt_to_cover: string;
  liquidated_collateral_amount: string;
  block_timestamp: number;
  block_number: string;
  transaction_hash: string;
  analysis_status: string;
  first_liquidatable_block: string | null;
  first_liquidatable_time: string | null;
  latency_seconds: number | null;
  blocks_liquidatable: string | null;
  collateral_symbol: string | null;
  collateral_decimals: number | null;
  collateral_price_usd: number | null;
  debt_symbol: string | null;
  debt_decimals: number | null;
  debt_price_usd: number | null;
}

interface LiquidationsTableProps {
  minBonusThreshold: number;
}

type Order = 'asc' | 'desc';
type SortableColumn = 'liquidated_collateral_amount' | 'debt_to_cover' | 'liquidation_bonus' | 'block_timestamp';

const userColumn = (value: string) => (
  <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <img className="blockie-icon" src={makeBlockie(value)} alt="" />
    {value.slice(0, 6)}...{value.slice(-4)}
  </Box>
);

const formatUsd = (value: number) => {
  if (value === 0) return <><span style={{ color: '#808080' }}>$</span>0.00</>;
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

const formatTokenAmount = (value: number) => {
  if (value > 0 && value < 0.01) return '< 0.01';
  return numbro(value).format({
    average: true,
    totalLength: 4,
    mantissa: 2,
  });
};

const calculateTokenAmount = (
  rawAmount: string,
  tokenDecimals: number | null,
  tokenPrice: number | null
) => {
  if (tokenDecimals == null || tokenPrice == null) {
    return { humanAmount: 0, usdValue: 0 };
  }
  const rawBigInt = BigInt(rawAmount);
  const divisor = BigInt(10 ** tokenDecimals);
  const wholePart = rawBigInt / divisor;
  const remainder = rawBigInt % divisor;
  const humanAmount = Number(wholePart) + Number(remainder) / Number(divisor);
  const usdValue = humanAmount * tokenPrice;
  return { humanAmount, usdValue };
};

const TRUST_WALLET_BASE_URL =
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/';

const tokenIconUrl = (addr: string) =>
  `${TRUST_WALLET_BASE_URL}${getAddress(addr)}/logo.png`;

const TokenIcon = ({ tokenAddress }: { tokenAddress: string }) => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <img
        src={makeBlockie(tokenAddress)}
        alt=""
        width={24}
        height={24}
        style={{ borderRadius: '50%' }}
      />
    );
  }

  return (
    <img
      src={tokenIconUrl(tokenAddress)}
      alt=""
      width={24}
      height={24}
      style={{ borderRadius: '50%' }}
      onError={() => setHasError(true)}
    />
  );
};

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
        sx={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', paddingLeft: '32px' }}
      >
        {formatUsd(usdValue)}
      </Typography>
    </Box>
  );
};

const calculateBonus = (row: LiquidationCall) => {
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
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [orderBy, setOrderBy] = React.useState<SortableColumn>('block_timestamp');
  const [order, setOrder] = React.useState<Order>('desc');
  const [collateralFilter, setCollateralFilter] = React.useState<string | null>(null);
  const [debtFilter, setDebtFilter] = React.useState<string | null>(null);
  const [walletFilter, setWalletFilter] = React.useState('');
  const [collateralAnchorEl, setCollateralAnchorEl] = React.useState<null | HTMLElement>(null);
  const [debtAnchorEl, setDebtAnchorEl] = React.useState<null | HTMLElement>(null);

  // Fetch all data for client-side filtering
  const { liquidations: allLiquidations, isLoading, error } = useLiquidations(10000, 0);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(0);
  }, [minBonusThreshold, collateralFilter, debtFilter, walletFilter]);

  // Filter by minimum bonus threshold first
  const thresholdFilteredData = React.useMemo(() => {
    return allLiquidations.filter((liq: LiquidationCall) => {
      const bonus = calculateBonus(liq);
      return bonus >= minBonusThreshold;
    });
  }, [allLiquidations, minBonusThreshold]);

  // Get unique assets for dropdowns (only from threshold-filtered data)
  const collateralAssets = React.useMemo(() => {
    const assets = new Set<string>();
    thresholdFilteredData.forEach((liq: LiquidationCall) => {
      if (liq.collateral_symbol) assets.add(liq.collateral_symbol);
    });
    return Array.from(assets).sort();
  }, [thresholdFilteredData]);

  const debtAssets = React.useMemo(() => {
    const assets = new Set<string>();
    thresholdFilteredData.forEach((liq: LiquidationCall) => {
      if (liq.debt_symbol) assets.add(liq.debt_symbol);
    });
    return Array.from(assets).sort();
  }, [thresholdFilteredData]);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = allLiquidations.filter((row: LiquidationCall) => {
      // Min bonus threshold filter
      const bonus = calculateBonus(row);
      if (bonus < minBonusThreshold) return false;

      // Collateral asset filter
      if (collateralFilter && row.collateral_symbol !== collateralFilter) return false;

      // Debt asset filter
      if (debtFilter && row.debt_symbol !== debtFilter) return false;

      // Wallet address filter
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

    // Sort
    filtered.sort((a: LiquidationCall, b: LiquidationCall) => {
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ margin: 2 }}>
        Error loading liquidations: {error.message}
      </Alert>
    );
  }

  const getCollateralCount = () =>
    collateralFilter
      ? thresholdFilteredData.filter((l: LiquidationCall) => l.collateral_symbol === collateralFilter).length
      : 0;

  const getDebtCount = () =>
    debtFilter
      ? thresholdFilteredData.filter((l: LiquidationCall) => l.debt_symbol === debtFilter).length
      : 0;

  const pillButtonStyles = {
    borderRadius: '50px',
    padding: '10px 24px',
    textTransform: 'none' as const,
    color: '#1a1a1a',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: 'none',
    },
  };

  return (
    <>
      <Box
        sx={{
          paddingY: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={e => setCollateralAnchorEl(e.currentTarget)}
          endIcon={<KeyboardArrowDownIcon sx={{ color: 'rgba(255, 255, 255, 0.87)' }} />}
          sx={{
            ...pillButtonStyles,
            backgroundColor: '#111e1c',
            color: 'rgba(255, 255, 255, 0.87)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: '#1a2a27',
              boxShadow: 'none',
            },
          }}
        >
          Collateral asset{/* ({getCollateralCount()}) */}
        </Button>
        <Menu
          anchorEl={collateralAnchorEl}
          open={Boolean(collateralAnchorEl)}
          onClose={() => setCollateralAnchorEl(null)}
          PaperProps={{
            sx: {
              backgroundColor: '#071311',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              maxHeight: 300,
              marginTop: 1,
              padding: 0,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setCollateralFilter(null);
              setCollateralAnchorEl(null);
            }}
            sx={{
              color: 'rgba(255, 255, 255, 0.87)',
              fontSize: '0.95rem',
              padding: '12px 24px',
              backgroundColor: '#111e1c',
              '&:hover': { backgroundColor: '#071311' },
            }}
          >
            All
          </MenuItem>
          {collateralAssets.map(asset => (
            <MenuItem
              key={asset}
              onClick={() => {
                setCollateralFilter(asset);
                setCollateralAnchorEl(null);
              }}
              selected={collateralFilter === asset}
              sx={{
                color: 'rgba(255, 255, 255, 0.87)',
                fontSize: '0.95rem',
                padding: '12px 24px',
                backgroundColor: '#111e1c',
                '&:hover': { backgroundColor: '#071311' },
                '&.Mui-selected': {
                  backgroundColor: '#071311',
                  color: 'rgba(255, 255, 255, 0.87)',
                  '&:hover': { backgroundColor: '#071311' },
                },
              }}
            >
              {asset}
            </MenuItem>
          ))}
        </Menu>

        <Button
          onClick={e => setDebtAnchorEl(e.currentTarget)}
          endIcon={<KeyboardArrowDownIcon sx={{ color: 'rgba(255, 255, 255, 0.87)' }} />}
          sx={{
            ...pillButtonStyles,
            backgroundColor: '#111e1c',
            color: 'rgba(255, 255, 255, 0.87)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: '#1a2a27',
              boxShadow: 'none',
            },
          }}
        >
          Debt asset{/* ({getDebtCount()}) */}
        </Button>
        <Menu
          anchorEl={debtAnchorEl}
          open={Boolean(debtAnchorEl)}
          onClose={() => setDebtAnchorEl(null)}
          PaperProps={{
            sx: {
              backgroundColor: '#071311',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              maxHeight: 300,
              marginTop: 1,
              padding: 0,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setDebtFilter(null);
              setDebtAnchorEl(null);
            }}
            sx={{
              color: 'rgba(255, 255, 255, 0.87)',
              fontSize: '0.95rem',
              padding: '12px 24px',
              backgroundColor: '#111e1c',
              '&:hover': { backgroundColor: '#071311' },
            }}
          >
            All
          </MenuItem>
          {debtAssets.map(asset => (
            <MenuItem
              key={asset}
              onClick={() => {
                setDebtFilter(asset);
                setDebtAnchorEl(null);
              }}
              selected={debtFilter === asset}
              sx={{
                color: 'rgba(255, 255, 255, 0.87)',
                fontSize: '0.95rem',
                padding: '12px 24px',
                backgroundColor: '#111e1c',
                '&:hover': { backgroundColor: '#071311' },
                '&.Mui-selected': {
                  backgroundColor: '#071311',
                  color: 'rgba(255, 255, 255, 0.87)',
                  '&:hover': { backgroundColor: '#071311' },
                },
              }}
            >
              {asset}
            </MenuItem>
          ))}
        </Menu>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50px',
            padding: '0 16px',
            width: 280,
          }}
        >
          <SearchIcon sx={{ color: '#808080', fontSize: '1.3rem', marginRight: 1 }} />
          <TextField
            size="small"
            value={walletFilter}
            onChange={e => setWalletFilter(e.target.value)}
            placeholder="Search by wallet"
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{
              flex: 1,
              '& .MuiInputBase-input': {
                color: 'rgba(255, 255, 255, 0.87)',
                fontSize: '1rem',
                padding: '10px 0',
                '&::placeholder': { color: '#808080', opacity: 1 },
              },
            }}
          />
        </Box>
      </Box>

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
            {paginatedData.map((row: LiquidationCall) => {
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
        rowsPerPageOptions={[10, 25, 100]}
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
