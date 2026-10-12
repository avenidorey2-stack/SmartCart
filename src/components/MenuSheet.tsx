import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme';

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
          style={styles.row}
          onPress={() => {
            onClose();
            // iOS can't present a new Modal while this one is still dismissing.
            setTimeout(a.onPress, 350);
          }}
        >
          <Ionicons name={a.icon} size={22} color={a.destructive ? colors.danger : colors.text} />
          <Text style={[styles.label, a.destructive && { color: colors.danger }]}>{a.label}</Text>
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  label: { fontSize: 16, color: colors.text },
});
