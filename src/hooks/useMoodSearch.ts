import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { moodService } from '@services/mood.service';
import { useMoodStore } from '@stores/mood.store';
import { useCreditStore } from '@stores/credit.store';
import { useMapFilterStore } from '@stores/mapFilter.store';
import { analytics } from '@utils/analytics';
import { useAiAd } from '@hooks/useAiAd';

export function useMoodSearch() {
  const { setSearchResult, setSearching } = useMoodStore();
  const { credits, isPremium, syncBalance } = useCreditStore();
  const { limit, radius } = useMapFilterStore();
  const { maybeShowAd } = useAiAd();

  const mutation = useMutation({
    mutationFn: moodService.search,
    onMutate: () => {
      setSearchResult(null);
      setSearching(true);
    },
    onSuccess: (result) => {
      setSearchResult(result);
      // 검색 완료 후 서버에서 실제 차감된 잔액 동기화
      syncBalance();
      analytics.track('SEARCH', { query: result.query, resultCount: result.places.length });
      // 비프리미엄 유저: 35% 확률로 전면 광고 노출
      maybeShowAd();
    },
    onError: () => {
      setSearchResult(null);
      syncBalance();
    },
    onSettled: () => setSearching(false),
  });

  const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 };

  // 구독자는 무제한, 비구독자는 최소 5 크레딧 필요
  const hasEnoughCredits = isPremium || credits >= 5;

  const search = useCallback(
    (query: string, coords?: { lat: number; lng: number }) => {
      if (!hasEnoughCredits) return;
      const location = coords ?? DEFAULT_COORDS;
      mutation.mutate({ query, ...location, limit, radius });
    },
    [mutation, hasEnoughCredits, limit, radius],
  );

  return {
    search,
    isLoading: mutation.isPending,
    error: mutation.error,
    hasEnoughCredits,
    credits,
    isPremium,
  };
}
