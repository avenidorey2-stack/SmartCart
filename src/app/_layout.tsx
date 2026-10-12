import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useSyncExternalStore } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Showcase } from '@/components/Showcase';
import { MAX_APP_WIDTH, SHOWCASE_MIN_WIDTH, colors } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const { width } = useWindowDimensions();

  const app = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
    </Stack>
  );

  // Desktop browsers get a landing page with the live app in a phone frame; tablets and mid-size
  // windows keep the phone layout in a centered column instead of stretching it.
  // The static HTML is rendered without a window, so only pick a wide layout once hydrated.
  const hydrated = useHydrated();
  const showcase = hydrated && width >= SHOWCASE_MIN_WIDTH;
  const wide = hydrated && width > MAX_APP_WIDTH + 40;

  return (
    <SafeAreaProvider>
      <Head>
        <title>SmartCart — shop smart, spend less</title>
      </Head>
      <StatusBar style="dark" />
      {!fontsLoaded ? (
        <View style={styles.page} />
      ) : showcase ? (
        <Showcase>{app}</Showcase>
      ) : (
        <View style={[styles.page, wide && { backgroundColor: colors.page }]}>
          <View style={[styles.column, wide && styles.columnWide]}>{app}</View>
        </View>
      )}
    </SafeAreaProvider>
  );
}

const noop = () => () => {};
/** false during static rendering and hydration, true afterwards (and always on native). */
function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: MAX_APP_WIDTH, alignSelf: 'center', backgroundColor: colors.bg, overflow: 'hidden' },
  columnWide: { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
