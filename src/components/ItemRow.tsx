import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { money } from '@/lib/format';
import type { Item } from '@/store/useListStore';
import { colors } from '@/theme';

type Props = {
  item: Item;
  onToggle: (id: string) => void;
  onPress: (item: Item) => void;
};

export const ItemRow = memo(function ItemRow({ item, onToggle, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={() => onPress(item)} accessibilityHint="Edit item">
      <Pressable
        onPress={() => onToggle(item.id)}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={`Mark ${item.name} as picked up`}
        style={[styles.circle, item.checked && styles.circleOn]}
      >
        {item.checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </Pressable>
      <View style={styles.body}>
        <Text style={[styles.name, item.checked && styles.done]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta}>
          {money(item.price)} · ×{item.qty} · {item.unit}
          {item.source === 'scan' ? '  ·  scanned' : ''}
        </Text>
      </View>
      {item.qty > 1 ? <Text style={styles.total}>{money(item.price * item.qty)}</Text> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#B5B5B5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  circleOn: { backgroundColor: colors.green, borderColor: colors.green },
  body: { flex: 1 },
  name: { fontSize: 17, color: colors.text, marginBottom: 3 },
  done: { color: colors.textFaint, textDecorationLine: 'line-through' },
  meta: { fontSize: 13, color: colors.textMuted },
  total: { fontSize: 14, color: colors.textMuted, fontVariant: ['tabular-nums'] },
});
