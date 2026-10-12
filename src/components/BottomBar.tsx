import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow } from '@/theme';

type Props = { onAdd: () => void; onScan: () => void };

/** The two ways to add an item, labelled so they're obvious at a glance. */
export function BottomBar({ onAdd, onScan }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Pressable
        onPress={onScan}
        style={({ pressed }) => [styles.button, styles.scan, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Scan price tag"
      >
        <MaterialCommunityIcons name="line-scan" size={22} color={colors.brand} />
        <Text style={[styles.label, { color: colors.brand }]}>Scan tag</Text>
      </Pressable>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.button, styles.add, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Add item"
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={[styles.label, { color: '#fff' }]}>Add item</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scan: { backgroundColor: colors.greenSoft },
  add: { backgroundColor: colors.green, ...shadow, shadowColor: colors.green, shadowOpacity: 0.35 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  label: { fontSize: 16, fontWeight: '700' },
});
