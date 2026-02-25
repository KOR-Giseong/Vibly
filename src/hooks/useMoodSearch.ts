import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { moodService } from '@services/mood.service';
import { useMoodStore } from '@stores/mood.store';
import { analytics } from '@utils/analytics';

export function useMoodSearch() {
  const { setSearchResult, setSearching, decrementRateLimit, rateLimitRemaining } = useMoodStore();

  const mutation = useMutation({
    mutationFn: moodService.search,
    onMutate: () => {
      setSearchResult(null); // 이전 결과 초기화 (구 결과가 잠깐 보이는 현상 방지)
      setSearching(true);
      decrementRateLimit();
    },
    onSuccess: (result) => {
      setSearchResult(result);
      analytics.track('SEARCH', { query: result.query, resultCount: result.places.length });
    },
    onError: () => {
      setSearchResult(null);
    },
    onSettled: () => setSearching(false),
  });

  // 위치 권한 없을 때 서울 시청 기본값 사용
  const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 };

  const search = useCallback(
    (query: string, coords?: { lat: number; lng: number }) => {
      if (rateLimitRemaining <= 0) return;
      const location = coords ?? DEFAULT_COORDS;
      mutation.mutate({ query, ...location });
    },
    [mutation, rateLimitRemaining],
  );

  return {
    search,
    isLoading: mutation.isPending,
    error: mutation.error,
    isRateLimited: rateLimitRemaining <= 0,
    rateLimitRemaining,
  };
}
