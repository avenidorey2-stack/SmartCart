import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

import { Sheet } from './Sheet';

export type MenuAction = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  destructive?: boolean;
};

export function MenuSheet({ visible, actions, onClose }: { visible: boolean; actions: MenuAction[]; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {actions.map((a) => (
        <Pressable
          key={a.label}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          onPress={() => {
            onClose();
            // iOS can't present a new Modal while this one is still dismissing.
            setTimeout(a.onPress, 350);
          }}
        >
          <View style={[styles.icon, a.destructive && { backgroundColor: '#FBE4DF' }]}>
            <Ionicons name={a.icon} size={19} color={a.destructive ? colors.danger : colors.brand} />
          </View>
          <Text style={[styles.label, a.destructive && { color: colors.danger }]}>{a.label}</Text>
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
});
