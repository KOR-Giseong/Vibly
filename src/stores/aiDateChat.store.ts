import { create } from 'zustand';
import type { Place } from '@/types';

export interface ChatBubble {
  id: string;
  role: 'user' | 'model';
  text: string;
  places?: Place[];
  imageUri?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatBubble[];
}

const MAX_SESSIONS = 10;

export const WELCOME_MSG: ChatBubble = {
  id: 'welcome',
  role: 'model',
  text: '안녕하세요! 오늘 데이트 계획을 도와드릴게요 💕\n어떤 분위기의 데이트를 원하시나요?',
};

interface AiDateChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentMessages: ChatBubble[];

  setCurrentMessages: (msgs: ChatBubble[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  persistSession: (msgs: ChatBubble[], sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  startNewChat: () => void;
  loadSession: (session: ChatSession) => void;
}

export const useAiDateChatStore = create<AiDateChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  currentMessages: [WELCOME_MSG],

  setCurrentMessages: (msgs) => set({ currentMessages: msgs }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  persistSession: (msgs, sessionId) => {
    const userMsgs = msgs.filter((m) => m.role === 'user');
    if (userMsgs.length === 0) return;

    const all = [...get().sessions];
    const title = userMsgs[0].text.slice(0, 30) + (userMsgs[0].text.length > 30 ? '…' : '');
    const idx = all.findIndex((s) => s.id === sessionId);

    if (idx >= 0) {
      all[idx] = { ...all[idx], messages: msgs };
    } else {
      all.unshift({ id: sessionId, title, createdAt: new Date().toISOString(), messages: msgs });
      if (all.length > MAX_SESSIONS) all.splice(MAX_SESSIONS);
    }
    set({ sessions: all });
  },

  deleteSession: (sessionId) => {
    const updated = get().sessions.filter((s) => s.id !== sessionId);
    set({ sessions: updated });
    if (get().currentSessionId === sessionId) {
      set({ currentMessages: [WELCOME_MSG], currentSessionId: null });
    }
  },

  startNewChat: () => {
    set({ currentMessages: [WELCOME_MSG], currentSessionId: null });
  },

  loadSession: (session) => {
    set({ currentMessages: session.messages, currentSessionId: session.id });
  },
}));
