import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { money } from '@/lib/format';
import { useBudget } from '@/store/useListStore';
import { colors, radius, shadow } from '@/theme';

/** Sticky Budget / Spent / Remaining widget with an animated left-to-right progress bar. */
export function BudgetCard({ onPress }: { onPress: () => void }) {
  const { budget, spent, remaining, progress, over } = useBudget();
  const [anim] = useState(() => new Animated.Value(progress));

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 450, useNativeDriver: false }).start();
  }, [anim, progress]);

  const barColor = over ? colors.danger : colors.green;

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Budget ${money(budget)}, spent ${money(spent)}, remaining ${money(remaining)}. Tap to edit budget.`}
    >
      <View style={styles.row}>
        <Stat label="Budget" value={money(budget)} />
        <Stat label="Spent" value={money(spent)} align="center" />
        <Stat
          label={over ? 'Over by' : 'Remaining'}
          value={money(Math.abs(remaining))}
          align="right"
          color={barColor}
        />
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

function Stat({
  label,
  value,
  align = 'left',
  color = colors.text,
}: {
  label: string;
  value: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
}) {
  const alignItems = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  return (
    <View style={{ flex: 1, alignItems }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    marginHorizontal: 12,
    ...shadow,
  },
  row: { flexDirection: 'row', marginBottom: 12 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
