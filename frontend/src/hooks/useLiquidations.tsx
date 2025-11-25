import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QUERY_STALE_TIME_LIQUIDATIONS, QUERY_GC_TIME } from '../constants';

export function useLiquidations(limit: number, offset: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['liquidations', { limit, offset }],
    queryFn: () => api.getLiquidations(limit, offset),
    staleTime: QUERY_STALE_TIME_LIQUIDATIONS,
    gcTime: QUERY_GC_TIME,
  });

  return {
    liquidations: data?.data || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refetch,
  };
}
