import { View, Image, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '@constants/theme';
import type { CoupleMemory } from '@types';

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 6;
const ITEM_SIZE = (width - PADDING * 2 - GAP) / 2;

interface Props {
  memories: CoupleMemory[];
  myUserId: string;
  onPress: (memory: CoupleMemory) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function MemoryGrid({ memories, onPress }: Props) {
  if (memories.length === 0) return null;

  return (
    <View style={styles.grid}>
      {memories.map((memory) => (
        <TouchableOpacity
          key={memory.id}
          style={styles.item}
          onPress={() => onPress(memory)}
          activeOpacity={0.88}
        >
          <Image source={{ uri: memory.imageUrl }} style={styles.image} />
          <View style={styles.overlay}>
            {memory.caption ? (
              <Text style={styles.caption} numberOfLines={1}>{memory.caption}</Text>
            ) : null}
            <Text style={styles.date}>{formatDate(memory.takenAt ?? memory.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: PADDING,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.gray[100],
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
});
