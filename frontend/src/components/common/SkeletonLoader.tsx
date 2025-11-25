import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export function CardSkeleton() {
  return (
    <Card
      variant="outlined"
      className="glass-border"
      sx={{
        backgroundColor: 'transparent',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <CardContent sx={{ '&:last-child': { paddingBottom: '0rem' } }}>
        <Skeleton
          variant="text"
          width="60%"
          height={24}
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Skeleton
          variant="text"
          width="40%"
          height={56}
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mt: 1 }}
        />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <Box sx={{ flexGrow: 1, paddingY: 2 }}>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 2 }}>
              <CardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ paddingY: 2 }}>
        <Card
          variant="outlined"
          className="glass-border"
          sx={{
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius-md)',
            padding: 3,
          }}
        >
          <Skeleton
            variant="text"
            width="30%"
            height={32}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 2 }}
          />
          <Skeleton
            variant="rectangular"
            height={300}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}
          />
        </Card>
      </Box>
    </>
  );
}

export function TableSkeleton() {
  return (
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
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {['Wallet', 'Collateral', 'Debt', 'Liquidator', 'Bonus', 'Time'].map(header => (
                <TableCell
                  key={header}
                  sx={{
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bg-card)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(10)].map((_, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  backgroundColor: 'var(--color-bg-row)',
                }}
              >
                {[...Array(6)].map((_, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    sx={{
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <Skeleton
                      variant="text"
                      width="80%"
                      height={24}
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export function LeaderboardSkeleton() {
  return (
    <Paper
      className="glass-border"
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'transparent',
        padding: 3,
      }}
    >
      <Skeleton
        variant="text"
        width="40%"
        height={32}
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 2 }}
      />
      {[...Array(10)].map((_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Skeleton
            variant="text"
            width="5%"
            height={24}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
          />
          <Skeleton
            variant="text"
            width="60%"
            height={24}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
          />
          <Skeleton
            variant="text"
            width="20%"
            height={24}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
          />
        </Box>
      ))}
    </Paper>
  );
}

export function ChartSkeleton() {
  return (
    <Paper
      className="glass-border"
      sx={{
        padding: 2,
        backgroundColor: 'transparent',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Skeleton
            variant="text"
            width={250}
            height={32}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
          />
          <Skeleton
            variant="text"
            width={400}
            height={20}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mt: 0.5 }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton
            variant="rectangular"
            width={200}
            height={32}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={200}
            height={32}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}
          />
        </Box>
      </Box>
      <Skeleton
        variant="rectangular"
        height={350}
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}
      />
    </Paper>
  );
}
