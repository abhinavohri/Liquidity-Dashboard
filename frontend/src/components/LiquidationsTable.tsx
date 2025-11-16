import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useLiquidations } from '../hooks/useLiquidations';
import makeBlockie from 'ethereum-blockies-base64';
import Typography from '@mui/material/Typography';
import { formatDistanceToNow } from 'date-fns';
import numbro from 'numbro';
import { getAddress } from "viem";


interface LiquidationCall {
  id: string;
  user: string;
  liquidator: string;
  collateral_asset: string;
  debt_asset: string;
  debt_to_cover: bigint;
  liquidated_collateral_amount: bigint;
  block_timestamp: number;
  block_number: bigint;
  transaction_hash: string;
  analysis_status: string; // defaults to "PENDING"

  first_liquidatable_block: bigint;
  first_liquidatable_time: Date | null; // timestamp() usually maps to JS Date
  latency_seconds: number | null;
  blocks_liquidatable: number | null;

  collateral_symbol: string | null;
  collateral_decimals: number | null;
  collateral_price_usd: number | null;

  debt_symbol: string | null;
  debt_decimals: number | null;
  debt_price_usd: number | null;
}

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left';
  format?: (value: any, row: LiquidationCall ) => React.ReactNode;
}

const userColumn = (value: string, row: LiquidationCall) => {
  return <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center'}}>
    <img className="blockie-icon" src={makeBlockie(value)} />
    {value.slice(0, 6)}...{value.slice(-4)}
  </Box>
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

const formatTokenAmount = (value: number) => {
  if (value > 0 && value < 0.01) {
    return '< 0.01';
  }

  return numbro(value).format({
    average: true,
    totalLength: 4,
    mantissa: 2,
  });
};

const calculateTokenAmount = (rawAmount: bigint, tokenDecimals: number | null, tokenPrice: number | null) => {
  if (tokenDecimals == null || tokenPrice == null) {
    return { humanAmount: 0, usdValue: 0 };
  }

  const humanAmount = Number(rawAmount) / (10 ** tokenDecimals);
  const usdValue = humanAmount * tokenPrice;

  return { humanAmount, usdValue };
}

const renderTokenAmount = (
  rawAmount: bigint,
  tokenAddress: string,
  tokenDecimals: number | undefined | null,
  tokenPrice: number | undefined | null
) => {
  if (tokenDecimals == null || tokenPrice == null) {
    return <span style={{ color: 'var(--color-text-secondary)'}}>...</span>;
  }

  const { humanAmount, usdValue } = calculateTokenAmount(rawAmount, tokenDecimals, tokenPrice)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img
          src={tokenIconUrl(tokenAddress)}
          alt=""
          width={24}
          height={24}
          style={{ borderRadius: '50%' }}
        />
        <span style={{ color: 'var(--color-text)' }}>
          {formatTokenAmount(humanAmount)}
        </span>
      </Box>
      <Typography sx={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', paddingLeft: '32px' }}>
          {formatUsd(usdValue)}
      </Typography>
    </Box>
  );
};

const TRUST_WALLET_BASE_URL = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/';


const tokenIconUrl = (addr: string) =>
  `${TRUST_WALLET_BASE_URL}${getAddress(addr)}/logo.png`;

const liquidationBonus = (row: LiquidationCall) => {
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
 
  const bonusUsd = collateralUsd - debtUsd;

  return (
    <Typography sx={{ 
      color: bonusUsd > 0 ? 'var(--color-success)' : 'var(--color-text)', 
      fontFamily: 'var(--font-family-values)'
    }}>
      {formatUsd(bonusUsd)}
    </Typography>
  );
}

const columns: readonly Column[] = [
  {
    id: 'user',
    label: 'Wallet',
    minWidth: 120,
    format: userColumn,
  },
  {
    id: 'liquidated_collateral_amount',
    label: 'Collateral Liquidated',
    minWidth: 60,
    format: (value, row) => renderTokenAmount(
        value,
        row.collateral_asset,
        row.collateral_decimals,
        row.collateral_price_usd
    ),
  },
  {
    id: 'debt_to_cover',
    label: 'Debt Repaid',
    minWidth: 120,
    format: (value, row) => renderTokenAmount(
        value,
        row.debt_asset,
        row.debt_decimals,
        row.debt_price_usd
      ),
    },
    {
    id: 'liquidator',
    label: 'Liquidator',
    minWidth: 120,
    format: userColumn,
  },
  {
    id: 'liquidation_bonus',
    label: 'Liquidation Bonus',
    minWidth: 150,
    align: 'right',
    format: (value, row) => liquidationBonus(row),
  },
  {
    id: 'block_timestamp',
    label: 'Time',
    minWidth: 170,
    format: (value: number) => {
      const date = new Date(value * 1000);
      
      return formatDistanceToNow(date, { addSuffix: true });
    },
  },
];

export default function LiquidationsTable() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const { liquidations, totalCount, isLoading, error } = useLiquidations(
    rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const isNumericalColumn = (columnId: string) => {
    return columnId === 'debt_to_cover' || columnId === 'block_timestamp';
  };

  return (
    <Paper
      className="glass-border"
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <TableContainer>
        <Table className='glass-border' sx={{overflow: "hidden" }} stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    minWidth: column.minWidth,
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bg-card)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {liquidations.map((row: any) => {
              return (
                <TableRow
                  sx={{
                    maxHeight: 440,
                    backgroundColor: 'var(--color-bg-row)',
                  }}
                  role="checkbox"
                  tabIndex={-1}
                  key={row.id}
                >
                  {columns.map(column => {
                    const value = row[column.id];
                    return (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        sx={{
                          fontSize: '1.1rem',
                          fontWeight: '500',
                          color: isNumericalColumn(column.id)
                            ? 'var(--color-text)'
                            : 'var(--color-text-secondary)',
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'color 0.15s ease',
                          '&:hover': {
                            color: 'var(--color-text)',
                          },
                        }}
                      >
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
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
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
