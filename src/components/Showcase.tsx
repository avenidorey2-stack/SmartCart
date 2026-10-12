import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors, eyebrow, fonts, radius } from '@/theme';

const FEATURES = [
  { n: '01', title: 'Scan the shelf tag', body: 'Point your camera at a price tag. Name and price fill themselves in.' },
  { n: '02', title: 'Watch the budget live', body: 'Every item updates what you’ve spent and what’s left — before checkout.' },
  { n: '03', title: 'Sorted by aisle', body: 'Items group into produce, dairy, pantry and more, automatically.' },
];

/** Desktop landing page: editorial copy on the left, the live app in a phone frame on the right. */
export function Showcase({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const phoneH = Math.min(height - 64, 860);
  const phoneW = Math.round(phoneH * 0.462);
  const [intro] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [intro]);

  const rise = (offset: number) => ({
    opacity: intro,
    transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
  });
  const big = width > 1280;

  return (
    <View style={styles.page}>
      {/* Decorative glow behind the phone */}
      <View pointerEvents="none" style={[styles.glow, { width: phoneH, height: phoneH, borderRadius: phoneH / 2 }]} />

      <View style={[styles.copy, { paddingHorizontal: big ? 88 : 56 }]}>
        <Animated.View style={rise(16)}>
          <Text style={styles.wordmark}>
            Smart<Text style={{ fontFamily: fonts.displayItalic, color: colors.lime }}>Cart</Text>
          </Text>
        </Animated.View>

        <Animated.View style={[rise(28), { marginTop: 48 }]}>
          <Text style={styles.kicker}>Grocery list · Budget · Scanner</Text>
          <Text style={[styles.headline, { fontSize: big ? 112 : 88, lineHeight: big ? 104 : 84 }]}>
            Shop smart.{'\n'}
            <Text style={{ fontFamily: fonts.displayItalic, color: colors.lime }}>Spend less.</Text>
          </Text>
          <Text style={styles.lede}>
            The grocery list that knows what things cost. Scan shelf tags, keep a running total, and walk out
            under budget.
          </Text>
        </Animated.View>

        <Animated.View style={[rise(40), styles.features]}>
          {FEATURES.map((f) => (
            <View key={f.n} style={styles.feature}>
              <Text style={styles.featureNum}>{f.n}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureBody}>{f.body}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[rise(52), styles.install]}>
          <View style={styles.installIcon}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.brand} />
          </View>
          <Text style={styles.installText}>
            <Text style={{ fontFamily: fonts.bold, color: colors.onBrand }}>Get it on your phone — free. </Text>
            Open this page in Safari or Chrome, then Share → Add to Home Screen.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.stage}>
        <Animated.View style={[rise(60), { width: phoneW, height: phoneH }]}>
          <View style={styles.phone}>
            <View style={styles.screen}>{children}</View>
          </View>
          <Tag style={{ left: -150, top: phoneH * 0.22, transform: [{ rotate: '-7deg' }] }} label="Avocados" price="$1.25" />
          <Tag style={{ right: -130, top: phoneH * 0.58, transform: [{ rotate: '5deg' }] }} label="Scanned" price="$4.25" scanned />
        </Animated.View>
      </View>
    </View>
  );
}

/** A little floating shelf tag beside the phone. */
function Tag({ label, price, scanned, style }: { label: string; price: string; scanned?: boolean; style: object }) {
  return (
    <View pointerEvents="none" style={[styles.tag, style]}>
      <View style={styles.tagHole} />
      <View>
        <Text style={styles.tagLabel}>
          {scanned ? '✓ ' : ''}
          {label}
        </Text>
        <Text style={styles.tagPrice}>{price}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, flexDirection: 'row', backgroundColor: colors.brand, overflow: 'hidden' },
  glow: { position: 'absolute', right: '6%', top: '8%', backgroundColor: colors.lime, opacity: 0.09 },
  copy: { flex: 1, justifyContent: 'center', maxWidth: 760 },
  wordmark: { fontFamily: fonts.display, fontSize: 30, color: colors.onBrand, letterSpacing: -0.5 },
  kicker: { ...eyebrow, color: colors.lime, marginBottom: 20 },
  headline: { fontFamily: fonts.display, color: colors.onBrand, letterSpacing: -3 },
  lede: { fontFamily: fonts.medium, fontSize: 19, lineHeight: 30, color: colors.onBrandMuted, marginTop: 28, maxWidth: 520 },
  features: { flexDirection: 'row', gap: 28, marginTop: 56, maxWidth: 680 },
  feature: { flex: 1, borderTopWidth: 1, borderTopColor: 'rgba(245,242,234,0.18)', paddingTop: 16 },
  featureNum: { fontFamily: fonts.displayItalic, fontSize: 22, color: colors.lime, marginBottom: 8 },
  featureTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.onBrand, marginBottom: 6 },
  featureBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.onBrandMuted },
  install: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 48,
    padding: 14,
    paddingRight: 20,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(245,242,234,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(245,242,234,0.12)',
    alignSelf: 'flex-start',
    maxWidth: 560,
  },
  installIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.onBrandMuted },
  stage: { width: '42%', minWidth: 460, alignItems: 'center', justifyContent: 'center' },
  phone: {
    flex: 1,
    borderRadius: 52,
    padding: 10,
    backgroundColor: '#050F0B',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 30 },
  },
  screen: { flex: 1, borderRadius: 42, overflow: 'hidden', backgroundColor: colors.bg },
  tag: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  tagHole: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
  tagLabel: { ...eyebrow, fontSize: 10, color: colors.textMuted },
  tagPrice: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: colors.text },
});
