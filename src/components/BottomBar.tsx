import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, shadow } from '@/theme';

type Props = { onAdd: () => void; onScan: () => void };

/** Space the list needs at the bottom so its last row clears the floating dock. */
export const DOCK_CLEARANCE = 112;

/** Floating dock with the two ways to add an item. */
export function BottomBar({ onAdd, onScan }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.dock}>
        <Pressable
          onPress={onScan}
          style={({ pressed }) => [styles.button, styles.scan, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Scan price tag"
        >
          <MaterialCommunityIcons name="line-scan" size={20} color={colors.onBrand} />
          <Text style={[styles.label, { color: colors.onBrand }]}>Scan tag</Text>
        </Pressable>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [styles.button, styles.add, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Add item"
        >
          <Ionicons name="add" size={22} color={colors.text} />
          <Text style={[styles.label, { color: colors.text }]}>Add item</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  dock: {
    flexDirection: 'row',
    gap: 6,
    padding: 6,
    borderRadius: radius.xl,
    backgroundColor: colors.text,
    ...shadow,
    shadowOpacity: 0.3,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: radius.lg - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scan: { backgroundColor: 'rgba(245,242,234,0.08)' },
  add: { backgroundColor: colors.lime },
  pressed: { transform: [{ scale: 0.96 }] },
  label: { fontFamily: fonts.bold, fontSize: 15 },
});
