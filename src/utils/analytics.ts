import { apiClient } from '../services/api';

type EventType = 'SEARCH' | 'CLICK_PLACE' | 'NAVIGATION' | 'CHECKIN' | 'BOOKMARK' | 'SUBSCRIPTION';

interface EventPayload {
  [key: string]: unknown;
}

const queue: Array<{ type: EventType; payload: EventPayload; ts: string }> = [];

export const analytics = {
  track(type: EventType, payload: EventPayload = {}) {
    queue.push({ type, payload, ts: new Date().toISOString() });
    if (queue.length >= 10) {
      this.flush();
    }
  },

  async flush() {
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    try {
      await apiClient.post('/analytics/events', { events: batch });
    } catch {
      // 전송 실패 시 이벤트 유실 방지를 위해 큐에 다시 추가
      queue.unshift(...batch);
    }
  },
};
