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
        <Card variant="outlined" sx={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>
            <CardContent>
                <Typography gutterBottom sx={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                    {header}
                </Typography>
                <Typography sx={{ color: 'var(--color-text)', fontSize: 40 }}>
                    {value}
                </Typography>
            </CardContent>
            {/* <CardActions>
            <Button size="small">Learn More</Button>
        </CardActions> */}
        </Card>
    );
}
