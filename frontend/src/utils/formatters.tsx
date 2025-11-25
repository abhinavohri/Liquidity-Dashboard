import numbro from 'numbro';

/**
 * Format a number as USD with abbreviations (K, M, B)
 * Returns JSX with styled dollar sign and suffix
 */
export const formatUsd = (value: number) => {
  if (value === 0) return <><span style={{ color: '#808080' }}>$</span>0</>;
  const formatted = numbro(value).format({
    average: true,
    totalLength: 4,
    mantissa: 2,
  });
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

/**
 * Format a number as plain USD string (for charts/tooltips)
 */
export const formatUsdPlain = (value: number): string => {
  if (value === 0) return '$0';
  return numbro(value).format({
    average: true,
    totalLength: 4,
    mantissa: 2,
    prefix: '$',
  });
};

/**
 * Format latency in seconds to human-readable format (s, min, h)
 * Returns JSX with styled unit
 */
export const formatLatency = (seconds: number) => {
  if (seconds < 60) {
    return (
      <>
        {seconds.toFixed(1)}
        <span style={{ color: '#808080' }}>s</span>
      </>
    );
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return (
      <>
        {minutes.toFixed(1)}
        <span style={{ color: '#808080' }}>min</span>
      </>
    );
  }
  const hours = minutes / 60;
  return (
    <>
      {hours.toFixed(1)}
      <span style={{ color: '#808080' }}>h</span>
    </>
  );
};

/**
 * Format token amount with abbreviations
 */
export const formatTokenAmount = (value: number): string => {
  if (value > 0 && value < 0.01) return '< 0.01';
  return numbro(value).format({
    average: true,
    totalLength: 4,
    mantissa: 2,
  });
};

/**
 * Calculate token amount from raw blockchain value
 * Converts BigInt with decimals to human-readable number and USD value
 */
export const calculateTokenAmount = (
  rawAmount: string,
  tokenDecimals: number | null,
  tokenPrice: number | null
): { humanAmount: number; usdValue: number } => {
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
