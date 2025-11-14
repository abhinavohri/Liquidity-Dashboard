// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import CardActions from '@mui/material/CardActions';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

interface AnalyticsCard {
  header: string;
  value: string;
}

export default function AnalyticsCard({ header, value }: AnalyticsCard) {
  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: 'transparent',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)'
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
      {/* <CardActions>
            <Button size="small">Learn More</Button>
        </CardActions> */}
    </Card>
  );
}
