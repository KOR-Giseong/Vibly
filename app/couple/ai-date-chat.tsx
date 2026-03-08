import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, ScrollView, Alert,
} from 'react-native';
import { MMKV } from 'react-native-mmkv';

const chatStorage = new MMKV({ id: 'ai-date-chat' });
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MapPin, List, Plus, Trash2, X } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { coupleService } from '@services/couple.service';
import { usePlaceCacheStore } from '@stores/placeCache.store';
import ScreenTransition from '@components/ScreenTransition';
import { useAuthStore } from '@stores/auth.store';
import { useLocation } from '@hooks/useLocation';
import type { AiChatMessage, Place } from '@/types';

const QUICK_EMOJIS = ['❤️', '😘', '✨', '🎉', '🥰', '😊'];
const SESSIONS_KEY = 'ai_date_chat_sessions';
const MAX_SESSIONS = 10;

const WELCOME_MSG: ChatBubble = {
  id: 'welcome',
  role: 'model',
  text: '안녕하세요! 오늘 데이트 계획을 도와드릴게요 💕\n어떤 분위기의 데이트를 원하시나요?',
};

interface ChatBubble {
  id: string;
  role: 'user' | 'model';
  text: string;
  places?: Place[];
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatBubble[];
}

// MMKV 헬퍼
function loadSessions(): ChatSession[] {
  try {
    const raw = chatStorage.getString(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(sessions: ChatSession[]) {
  chatStorage.set(SESSIONS_KEY, JSON.stringify(sessions));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const M = d.getMonth() + 1, D = d.getDate();
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  return `${M}/${D} ${h}:${m}`;
}

export default function AiDateChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { coords } = useLocation();
  const { setPlace } = usePlaceCacheStore();

  const [messages, setMessages] = useState<ChatBubble[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const savedRef = useRef(false); // 이번 세션이 이미 저장됐는지

  // 진입 시 세션 목록 로드
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  // 현재 메시지를 세션에 저장 (첫 user 메시지 이후부터)
  const persistSession = useCallback((msgs: ChatBubble[], sessionId: string) => {
    const userMsgs = msgs.filter((m) => m.role === 'user');
    if (userMsgs.length === 0) return;

    const all = loadSessions();
    const title = userMsgs[0].text.slice(0, 30) + (userMsgs[0].text.length > 30 ? '…' : '');

    const idx = all.findIndex((s) => s.id === sessionId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], messages: msgs };
    } else {
      // 새 세션 추가 (맨 앞에)
      const newSession: ChatSession = {
        id: sessionId,
        title,
        createdAt: new Date().toISOString(),
        messages: msgs,
      };
      all.unshift(newSession);

      // 10개 초과 시 가장 오래된 것 자동 삭제
      if (all.length > MAX_SESSIONS) {
        all.splice(MAX_SESSIONS);
      }
    }

    saveSessions(all);
    setSessions([...all]);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 첫 전송 시 세션 ID 생성
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
    }

    const userMsg: ChatBubble = { id: Date.now().toString(), role: 'user', text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history: AiChatMessage[] = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await coupleService.aiDateChat(history, coords?.lat, coords?.lng);

      const modelMsg: ChatBubble = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.text,
        places: res.places,
      };
      const finalMessages = [...newMessages, modelMsg];
      setMessages(finalMessages);
      persistSession(finalMessages, sessionId);
    } catch {
      const errMsgs = [
        ...newMessages,
        { id: (Date.now() + 1).toString(), role: 'model' as const, text: '죄송해요, 잠시 후 다시 시도해주세요 🙏' },
      ];
      setMessages(errMsgs);
      persistSession(errMsgs, sessionId);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // 새 대화 시작
  const startNewChat = () => {
    setMessages([WELCOME_MSG]);
    setCurrentSessionId(null);
    setShowHistory(false);
  };

  // 과거 세션 불러오기
  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  // 세션 삭제
  const deleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessions(updated);
    setSessions(updated);
    if (currentSessionId === sessionId) {
      setMessages([WELCOME_MSG]);
      setCurrentSessionId(null);
    }
  };

  const renderBubble = ({ item }: { item: ChatBubble }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleModel]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
          {item.places && item.places.length > 0 && (
            <View style={styles.placesWrap}>
              {item.places.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.placeChip}
                  onPress={() => { setPlace(p.id, p); router.push(`/place/${p.id}`); }}
                  activeOpacity={0.8}
                >
                  <MapPin size={12} color={Colors.primary[600]} />
                  <Text style={styles.placeChipText} numberOfLines={1}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenTransition>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>💬 AI 데이트 비서</Text>
            <Text style={styles.headerSub}>프리미엄 전용</Text>
          </View>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => { setSessions(loadSessions()); setShowHistory(true); }}
          >
            <List size={20} color={Colors.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* 메시지 목록 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderBubble}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View style={styles.typingWrap}>
            <ActivityIndicator size="small" color={Colors.primary[400]} />
            <Text style={styles.typingText}>AI가 답변을 생성하고 있어요...</Text>
          </View>
        )}

        {/* 입력창 */}
        <View style={[styles.inputWrap, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.emojiRow}>
            {QUICK_EMOJIS.map((e) => (
              <TouchableOpacity key={e} onPress={() => sendMessage(e)} style={styles.emojiBtn}>
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor={Colors.gray[400]}
              multiline
              maxLength={200}
              onSubmitEditing={() => sendMessage(input)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 대화 목록 모달 */}
      <Modal visible={showHistory} animationType="slide" transparent onRequestClose={() => setShowHistory(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.md }]}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>대화 목록</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.modalCloseBtn}>
                <X size={20} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {/* 안내 문구 */}
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                💡 최대 {MAX_SESSIONS}개까지 저장돼요. 초과 시 가장 오래된 대화가 자동으로 삭제됩니다.
              </Text>
            </View>

            {/* 새 대화 버튼 */}
            <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat} activeOpacity={0.8}>
              <Plus size={16} color={Colors.white} />
              <Text style={styles.newChatText}>새 대화 시작</Text>
            </TouchableOpacity>

            {/* 세션 목록 */}
            {sessions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>저장된 대화가 없어요</Text>
              </View>
            ) : (
              <ScrollView style={styles.sessionList} showsVerticalScrollIndicator={false}>
                {sessions.map((session, idx) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionItem,
                      currentSessionId === session.id && styles.sessionItemActive,
                    ]}
                    onPress={() => loadSession(session)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionTitleRow}>
                        <Text style={styles.sessionIdx}>#{sessions.length - idx}</Text>
                        <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                      </View>
                      <Text style={styles.sessionDate}>{formatDate(session.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => {
                        Alert.alert('삭제', '이 대화를 삭제할까요?', [
                          { text: '취소', style: 'cancel' },
                          { text: '삭제', style: 'destructive', onPress: () => deleteSession(session.id) },
                        ]);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={Colors.gray[400]} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.sm,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  historyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[900], textAlign: 'center' },
  headerSub: { fontSize: FontSize.xs, color: Colors.primary[500], textAlign: 'center' },
  list: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.md },
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  bubbleWrapUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary[100], alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.primary[600] },
  bubble: {
    maxWidth: '75%', borderRadius: BorderRadius.xl, padding: Spacing.md,
    ...Shadow.sm,
  },
  bubbleUser: { backgroundColor: Colors.primary[500], borderBottomRightRadius: 4 },
  bubbleModel: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FontSize.sm, color: Colors.gray[800], lineHeight: 20 },
  bubbleTextUser: { color: Colors.white },
  placesWrap: { marginTop: Spacing.sm, gap: 6 },
  placeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary[50], borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary[100],
  },
  placeChipText: { fontSize: FontSize.xs, color: Colors.primary[600], fontWeight: FontWeight.medium, flex: 1 },
  typingWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.sm },
  typingText: { fontSize: FontSize.xs, color: Colors.gray[400] },
  inputWrap: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray[100], padding: Spacing.md },
  emojiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  emojiBtn: { padding: 4 },
  emojiText: { fontSize: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.gray[900],
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.gray[300] },

  // 모달
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: Spacing.lg, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray[100],
    alignItems: 'center', justifyContent: 'center',
  },
  noticeBox: {
    marginHorizontal: Spacing['2xl'], marginBottom: Spacing.md,
    backgroundColor: Colors.primary[50], borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary[100],
  },
  noticeText: { fontSize: FontSize.xs, color: Colors.primary[700], lineHeight: 18 },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginHorizontal: Spacing['2xl'], marginBottom: Spacing.md,
    backgroundColor: Colors.primary[500], borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  newChatText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
  emptyText: { fontSize: FontSize.sm, color: Colors.gray[400] },
  sessionList: { paddingHorizontal: Spacing['2xl'] },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[50], marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  sessionItemActive: {
    borderColor: Colors.primary[300], backgroundColor: Colors.primary[50],
  },
  sessionInfo: { flex: 1, gap: 2 },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sessionIdx: { fontSize: FontSize.xs, color: Colors.primary[400], fontWeight: FontWeight.bold },
  sessionTitle: { fontSize: FontSize.sm, color: Colors.gray[800], fontWeight: FontWeight.medium, flex: 1 },
  sessionDate: { fontSize: FontSize.xs, color: Colors.gray[400] },
  deleteBtn: { padding: Spacing.xs },
});
