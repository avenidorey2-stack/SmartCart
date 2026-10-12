import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_APP_WIDTH, colors, fonts, radius } from '@/theme';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Bottom sheet. Native uses Modal; the web draws it inside the screen instead, so on the desktop
 * showcase it opens within the phone frame rather than over the whole page.
 */
export function Sheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.grabber} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );

  if (Platform.OS === 'web') {
    return visible ? <WebSheet onClose={onClose}>{body}</WebSheet> : null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        {body}
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Mounted only while open, so the form inside starts fresh each time (same as Modal). */
function WebSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [t]);
  return (
    <View style={[StyleSheet.absoluteFill, styles.webRoot]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: t }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        style={{ transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  webRoot: { justifyContent: 'flex-end', zIndex: 10 },
  sheet: {
    width: '100%',
    maxWidth: MAX_APP_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  title: { fontFamily: fonts.display, fontSize: 34, letterSpacing: -0.5, color: colors.text, marginBottom: 16 },
});
