import { memo } from 'react';
import ErrorAlert from './ErrorAlert';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <ErrorAlert
      title={title}
      message={message}
      onAction={onRetry}
      actionLabel="Retry"
    />
  );
}

export default memo(ErrorMessage);
