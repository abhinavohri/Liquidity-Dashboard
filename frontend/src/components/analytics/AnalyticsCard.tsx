import { memo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface AnalyticsCard {
  header: string;
  value: ReactNode;
}

function AnalyticsCard({ header, value }: AnalyticsCard) {
  return (
    <Card
      variant="outlined"
      className="glass-border"
      sx={{
        backgroundColor: 'transparent',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <CardContent
        sx={{
          '&:last-child': {
            paddingBottom: '0rem',
          },
        }}
      >
        <Typography
          gutterBottom
          sx={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}
        >
          {header}
        </Typography>
        <Typography
          sx={{
            color: 'var(--color-text)',
            fontSize: 40,
            fontFamily: 'var(--font-family-values)',
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default memo(AnalyticsCard);
