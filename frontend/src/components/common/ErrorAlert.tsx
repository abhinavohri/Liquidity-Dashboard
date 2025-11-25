import { memo } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  showDetails?: boolean;
}

function ErrorAlert({
  title = 'Error',
  message,
  onAction,
  actionLabel = 'Retry',
  showDetails = false
}: ErrorAlertProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
      <Alert
        severity="error"
        sx={{
          maxWidth: 600,
          width: '100%',
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          color: 'var(--color-text)',
          border: '1px solid rgba(211, 47, 47, 0.3)',
          borderRadius: 'var(--radius-md)',
          '& .MuiAlert-icon': {
            color: '#ef5350',
          },
        }}
        action={
          onAction && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onAction}
              sx={{
                color: 'var(--color-text)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              {actionLabel}
            </Button>
          )
        }
      >
        <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>
        {message}
        {showDetails && import.meta.env.DEV && (
          <Box sx={{ mt: 2, fontSize: '0.875rem', opacity: 0.8 }}>
            {message}
          </Box>
        )}
      </Alert>
    </Box>
  );
}

export default memo(ErrorAlert);
