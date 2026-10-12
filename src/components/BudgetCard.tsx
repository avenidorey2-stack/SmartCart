import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { money } from '@/lib/format';
import { useBudget, useListStore } from '@/store/useListStore';
import { colors, eyebrow, fonts, radius, shadow } from '@/theme';

/** Hero budget card: money left in big shelf-tag type, an animated progress bar, and spend stats. */
export function BudgetCard({ onPress }: { onPress: () => void }) {
  const { budget, spent, remaining, progress, over } = useBudget();
  const items = useListStore((s) => s.items);
  const picked = items.filter((it) => it.checked).length;
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, progress]);

  const accent = over ? colors.danger : colors.lime;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`Budget ${money(budget)}, spent ${money(spent)}, ${over ? 'over by' : 'remaining'} ${money(Math.abs(remaining))}. Tap to edit budget.`}
    >
      <View style={styles.top}>
        <Text style={[styles.eyebrow, over && { color: colors.danger }]}>{over ? 'Over budget by' : 'Left to spend'}</Text>
        <View style={styles.budgetPill}>
          <Text style={styles.budgetPillText}>of {money(budget)}</Text>
        </View>
      </View>

      <TagPrice value={Math.abs(remaining)} color={over ? colors.danger : colors.onBrand} />

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: accent, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>

      <View style={styles.stats}>
        <Stat label="Spent" value={money(spent)} />
        <Stat label="Items" value={String(items.length)} />
        <Stat label="In cart" value={`${picked}/${items.length}`} />
      </View>
    </Pressable>
  );
}

/** "$71⁰⁶" — dollars large with small raised cents, like a shelf price tag. */
export function TagPrice({ value, color, size = 64 }: { value: number; color: string; size?: number }) {
  const [dollars, cents] = money(value).split('.');
  return (
    <View style={styles.price}>
      <Text style={[styles.dollars, { color, fontSize: size, lineHeight: size * 1.05 }]} numberOfLines={1} adjustsFontSizeToFit>
        {dollars}
      </Text>
      <Text style={[styles.cents, { color, fontSize: size * 0.45, lineHeight: size * 0.6 }]}>.{cents}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand,
    borderRadius: radius.xl,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    marginHorizontal: 16,
    ...shadow,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { ...eyebrow, color: colors.lime },
  budgetPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(245,242,234,0.22)',
  },
  budgetPillText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onBrandMuted },
  price: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6, marginBottom: 14 },
  dollars: { fontFamily: fonts.display, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  cents: { fontFamily: fonts.display, marginTop: 6, marginLeft: 2 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: 'rgba(245,242,234,0.14)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  stats: { flexDirection: 'row', marginTop: 14 },
  stat: { flex: 1 },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.onBrandMuted, marginBottom: 2 },
  statValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.onBrand, fontVariant: ['tabular-nums'] },
});
