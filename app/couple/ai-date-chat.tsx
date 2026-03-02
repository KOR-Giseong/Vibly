import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MapPin } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { coupleService } from '@services/couple.service';
import { usePlaceCacheStore } from '@stores/placeCache.store';
import ScreenTransition from '@components/ScreenTransition';
import { useAuthStore } from '@stores/auth.store';
import { useLocation } from '@hooks/useLocation';
import type { AiChatMessage, Place } from '@/types';

const QUICK_EMOJIS = ['❤️', '😘', '✨', '🎉', '🥰', '😊'];

interface ChatBubble {
  id: string;
  role: 'user' | 'model';
  text: string;
  places?: Place[];
}

export default function AiDateChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuthStore();
  const { coords } = useLocation();
  const { setPlace } = usePlaceCacheStore();

  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '안녕하세요! 오늘 데이트 계획을 도와드릴게요 💕\n어떤 분위기의 데이트를 원하시나요?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatBubble = { id: Date.now().toString(), role: 'user', text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history: AiChatMessage[] = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await coupleService.aiDateChat(
        history,
        coords?.latitude,
        coords?.longitude,
      );

      const modelMsg: ChatBubble = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.text,
        places: res.places,
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'model', text: '죄송해요, 잠시 후 다시 시도해주세요 🙏' },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
          <View style={{ width: 40 }} />
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
});
