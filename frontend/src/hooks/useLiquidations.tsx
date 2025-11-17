import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export function useLiquidations(limit: number, offset: number) {
  const [liquidations, setLiquidations] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLiquidations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/liquidations?limit=${limit}&offset=${offset}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        setLiquidations(result.data || []);
        setTotalCount(result.totalCount || 0);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch liquidations'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiquidations();
  }, [limit, offset]);

  return {
    liquidations,
    totalCount,
    isLoading,
    error,
  };
}
