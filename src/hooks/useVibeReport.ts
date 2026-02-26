import { useQuery, useQueryClient } from '@tanstack/react-query';
import { moodService } from '@services/mood.service';
import type { VibeReportResponse } from '@/types';

const STALE_TIME = 1000 * 60 * 5; // 5분

/**
 * 바이브 리포트 데이터 훅
 * - 주간 / 월간 전환 시 자동 refetch
 * - 5분 캐시 유지
 */
export function useVibeReport(period: 'weekly' | 'monthly') {
  return useQuery<VibeReportResponse>({
    queryKey: ['vibe-report', period],
    queryFn:  () => moodService.getVibeReport(period),
    staleTime: STALE_TIME,
    retry: 1,
  });
}

/** 특정 period 리포트를 미리 fetch 해두는 유틸 */
export function usePrefetchVibeReport() {
  const queryClient = useQueryClient();
  return (period: 'weekly' | 'monthly') =>
    queryClient.prefetchQuery({
      queryKey: ['vibe-report', period],
      queryFn:  () => moodService.getVibeReport(period),
      staleTime: STALE_TIME,
    });
}
