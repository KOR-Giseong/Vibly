type EventType = 'SEARCH' | 'CLICK_PLACE' | 'NAVIGATION' | 'CHECKIN' | 'BOOKMARK' | 'SUBSCRIPTION';

interface EventPayload {
  [key: string]: unknown;
}

// 실제 구현 시 백엔드 /analytics/events 로 전송
// 지금은 큐에 쌓고 배치 전송 구조
const queue: Array<{ type: EventType; payload: EventPayload; ts: string }> = [];

export const analytics = {
  track(type: EventType, payload: EventPayload = {}) {
    queue.push({ type, payload, ts: new Date().toISOString() });
    // TODO: 큐가 10개 이상이면 flush
    if (queue.length >= 10) {
      this.flush();
    }
  },

  async flush() {
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    // TODO: await apiClient.post('/analytics/events', { events: batch });
    console.debug('[Analytics] flush', batch.length, 'events');
  },
};
