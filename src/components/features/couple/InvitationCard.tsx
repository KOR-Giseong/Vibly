import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check, X, Flag, User } from 'lucide-react-native';
import { Colors } from '@constants/theme';
import type { CoupleInvitation } from '@types';

interface ReceivedProps {
  invitation: CoupleInvitation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onReport?: (senderId: string, senderName: string) => void;
  loading?: boolean;
}

interface SentProps {
  invitation: CoupleInvitation;
  onCancel: (id: string) => void;
  loading?: boolean;
}

function Avatar({ url }: { name: string; url?: string }) {
  if (url) return <Image source={{ uri: url }} style={styles.avatar} />;
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <User size={22} color="#E60076" strokeWidth={1.5} />
    </View>
  );
}

export function ReceivedInvitationCard({ invitation, onAccept, onReject, onReport, loading }: ReceivedProps) {
  const sender = invitation.sender;
  const name = sender?.nickname ?? sender?.name ?? '알 수 없음';

  return (
    <View style={styles.cardWrap}>
      <View style={styles.card}>
        <Avatar name={name} url={sender?.avatarUrl} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          {invitation.message ? (
            <Text style={styles.message} numberOfLines={1}>{invitation.message}</Text>
          ) : (
            <Text style={styles.subText}>커플 초대를 보냈습니다</Text>
          )}
          <Text style={styles.time}>{new Date(invitation.createdAt).toLocaleDateString('ko-KR')}</Text>
        </View>
        {loading ? (
          <ActivityIndicator color="#E60076" />
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              onPress={() => onAccept(invitation.id)}
            >
              <Check size={16} color={Colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={() => onReject(invitation.id)}
            >
              <X size={16} color={Colors.gray[500]} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 수신자 주의 안내 */}
      <View style={styles.warningRow}>
        <Text style={styles.warningText}>
          모르는 사람으로부터의 초대는 신중히 확인하세요. 문제가 있으면{' '}
        </Text>
        {onReport && sender?.id && (
          <TouchableOpacity onPress={() => onReport(sender.id, name)} style={styles.reportLink}>
            <Flag size={10} color="#DC2626" />
            <Text style={styles.reportLinkText}>신고</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.warningText}>하거나 고객센터를 이용해주세요.</Text>
      </View>
    </View>
  );
}

export function SentInvitationCard({ invitation, onCancel, loading }: SentProps) {
  const receiver = invitation.receiver;
  const name = receiver?.nickname ?? receiver?.name ?? '알 수 없음';

  return (
    <View style={styles.card}>
      <Avatar name={name} url={receiver?.avatarUrl} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {invitation.message ? (
          <Text style={styles.message} numberOfLines={1}>{invitation.message}</Text>
        ) : (
          <Text style={styles.subText}>초대 대기 중</Text>
        )}
        <Text style={styles.time}>{new Date(invitation.createdAt).toLocaleDateString('ko-KR')}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.gray[400]} />
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.cancelBtn]}
          onPress={() => onCancel(invitation.id)}
        >
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    gap: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  warningRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  warningText: {
    fontSize: 10,
    color: Colors.gray[400],
    lineHeight: 15,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reportLinkText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    textDecorationLine: 'underline',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  message: {
    fontSize: 13,
    color: Colors.gray[600],
  },
  subText: {
    fontSize: 13,
    color: Colors.gray[400],
  },
  time: {
    fontSize: 11,
    color: Colors.gray[300],
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: '#E60076',
  },
  rejectBtn: {
    backgroundColor: Colors.gray[100],
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    width: 'auto',
    height: 'auto',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[600],
  },
});
