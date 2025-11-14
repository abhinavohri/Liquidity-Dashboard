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

interface Column {
  id: 'user' | 'liquidator' | 'collateral_asset' | 'debt_asset' | 'debt_to_cover' | 'block_timestamp' | 'transaction_hash';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left';
  format?: (value: any) => string;
}

const columns: readonly Column[] = [
  {
    id: 'user',
    label: 'User',
    minWidth: 120,
    format: (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`
  },
  {
    id: 'liquidator',
    label: 'Liquidator',
    minWidth: 120,
    format: (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`
  },
  {
    id: 'collateral_asset',
    label: 'Collateral Asset',
    minWidth: 120,
    format: (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`
  },
  {
    id: 'debt_asset',
    label: 'Debt Asset',
    minWidth: 120,
    format: (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`
  },
  {
    id: 'debt_to_cover',
    label: 'Debt to Cover',
    minWidth: 150,
    align: 'right',
    format: (value: bigint) => (Number(value) / 1e18).toFixed(4),
  },
  {
    id: 'block_timestamp',
    label: 'Timestamp',
    minWidth: 170,
    format: (value: number) => new Date(value * 1000).toLocaleString(),
  },
  {
    id: 'transaction_hash',
    label: 'Tx Hash',
    minWidth: 120,
    format: (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`
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

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440, border: '1px solid var(--border-color)'}}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    minWidth: column.minWidth,
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-bg-card)'
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
                  sx={{ maxHeight: 440, backgroundColor: "var(--color-bg-row)"}}
                  role="checkbox"
                  tabIndex={-1}
                  key={row.id}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(value) : value}
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
        sx={{backgroundColor: "var(--color-bg-row)", color: 'var(--color-text)'}}
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
