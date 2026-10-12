import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { money } from '@/lib/format';
import type { Item } from '@/store/useListStore';
import { colors, radius } from '@/theme';

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
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {item.qty} {item.unit}
            {item.qty > 1 ? ` · ${money(item.price)} each` : ''}
          </Text>
          {item.source === 'scan' ? (
            <View style={styles.badge}>
              <Ionicons name="scan-outline" size={11} color={colors.brand} />
              <Text style={styles.badgeText}>Scanned</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={[styles.total, item.checked && styles.totalDone]}>{money(item.price * item.qty)}</Text>
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: 13, color: colors.textMuted },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
  },
  badgeText: { fontSize: 11, color: colors.brand, fontWeight: '600' },
  total: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12, fontVariant: ['tabular-nums'] },
  totalDone: { color: colors.textFaint, fontWeight: '400' },
});
