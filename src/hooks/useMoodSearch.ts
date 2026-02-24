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
      setSearching(true);
      decrementRateLimit();
    },
    onSuccess: (result) => {
      setSearchResult(result);
      analytics.track('SEARCH', { query: result.query, resultCount: result.places.length });
    },
    onSettled: () => setSearching(false),
  });

  const search = useCallback(
    (query: string, coords?: { lat: number; lng: number }) => {
      if (rateLimitRemaining <= 0) return;
      mutation.mutate({ query, ...coords });
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
