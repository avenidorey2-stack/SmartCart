import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { money } from '@/lib/format';
import type { Item } from '@/store/useListStore';
import { colors, fonts, radius } from '@/theme';

type Props = {
  item: Item;
  /** Position within its category, for the entrance stagger and the grouped-card corners. */
  index: number;
  last: boolean;
  onToggle: (id: string) => void;
  onPress: (item: Item) => void;
};

export const ItemRow = memo(function ItemRow({ item, index, last, onToggle, onPress }: Props) {
  const [enter] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, 8) * 45,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [enter, index]);

  const toggle = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    pop.setValue(0.7);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 220, useNativeDriver: Platform.OS !== 'web' }).start();
    onToggle(item.id);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        index === 0 && styles.first,
        last && styles.last,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.sunken }]}
        onPress={() => onPress(item)}
        accessibilityHint="Edit item"
      >
        <Pressable
          onPress={toggle}
          hitSlop={12}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.checked }}
          accessibilityLabel={`Mark ${item.name} as picked up`}
        >
          <Animated.View style={[styles.circle, item.checked && styles.circleOn, { transform: [{ scale: pop }] }]}>
            {item.checked ? <Ionicons name="checkmark" size={15} color={colors.lime} /> : null}
          </Animated.View>
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
                <Ionicons name="scan-outline" size={10} color={colors.brand} />
                <Text style={styles.badgeText}>Scanned</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={[styles.total, item.checked && styles.totalDone]}>{money(item.price * item.qty)}</Text>
      </Pressable>
      {!last ? <View style={styles.divider} /> : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, backgroundColor: colors.surface, overflow: 'hidden' },
  first: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  last: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 58 },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  circleOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  body: { flex: 1 },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, marginBottom: 3 },
  done: { color: colors.textFaint, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, color: colors.brand, letterSpacing: 0.3 },
  total: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginLeft: 12, fontVariant: ['tabular-nums'] },
  totalDone: { color: colors.textFaint, fontFamily: fonts.medium },
});
