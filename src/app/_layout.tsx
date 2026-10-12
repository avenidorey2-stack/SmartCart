import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MAX_APP_WIDTH, colors } from '@/theme';

export default function RootLayout() {
  // On desktop browsers and tablets, keep the phone layout in a centered column instead of stretching it.
  const wide = useWindowDimensions().width > MAX_APP_WIDTH + 40;
  return (
    <SafeAreaProvider>
      <Head>
        <title>SmartCart</title>
      </Head>
      <StatusBar style="dark" />
      <View style={[styles.page, wide && { backgroundColor: colors.page }]}>
        <View style={[styles.column, wide && styles.columnWide]}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: MAX_APP_WIDTH, alignSelf: 'center', backgroundColor: colors.bg, overflow: 'hidden' },
  columnWide: { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
