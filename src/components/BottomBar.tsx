import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow } from '@/theme';

type Props = { onMic: () => void; onAdd: () => void; onScan: () => void };

export function BottomBar({ onMic, onAdd, onScan }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Pressable onPress={onMic} hitSlop={10} style={styles.side} accessibilityLabel="Add by voice">
        <Ionicons name="mic-outline" size={28} color={colors.textMuted} />
      </Pressable>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
        accessibilityLabel="Add item"
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
      <Pressable onPress={onScan} hitSlop={10} style={styles.side} accessibilityLabel="Scan price tag">
        <MaterialCommunityIcons name="line-scan" size={28} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  side: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowColor: colors.green,
    shadowOpacity: 0.4,
  },
});
