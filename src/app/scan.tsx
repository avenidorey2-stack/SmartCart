import { Ionicons } from '@expo/vector-icons';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categorize } from '@/lib/categorize';
import { cloudRecognize, cloudScanAvailable } from '@/lib/cloudScan';
import { money, parseMoney } from '@/lib/format';
import { parseScan, type Rect, type ScanResult } from '@/lib/ocr';
import { useBudget, useListStore } from '@/store/useListStore';
import { colors, fonts, radius } from '@/theme';

type Photo = { uri: string; width: number; height: number };
type Phase = 'live' | 'processing' | 'result';
type Point = { x: number; y: number };

const NEEDS_SETUP = 'needs-setup';

/** On-device ML Kit when available (dev builds); otherwise free OCR.space (Expo Go). */
async function readTag(uri: string, photo: { width: number; height: number }, focus: Rect): Promise<ScanResult> {
  try {
    return parseScan(await TextRecognition.recognize(uri), focus);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("doesn't seem to be linked")) throw e;
  }
  if (!cloudScanAvailable) throw new Error(NEEDS_SETUP);
  return parseScan(await cloudRecognize(uri, photo, focus), focus);
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  // Measure the screen itself, not the window: on wide web/tablet layouts it sits in a narrower column.
  const win = useWindowDimensions();
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const W = box?.width ?? win.width;
  const H = box?.height ?? win.height;

  const addItem = useListStore((s) => s.addItem);
  const { remaining } = useBudget();

  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('live');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  // Scan brackets in screen coordinates. Only text inside them is considered.
  const focus: Rect = { left: W * 0.08, top: H * 0.2, width: W * 0.84, height: H * 0.5 };

  // The frozen photo is drawn with resizeMode="cover", so map image px <-> screen px the same way.
  const fit = photo
    ? (() => {
        const scale = Math.max(W / photo.width, H / photo.height);
        return { scale, dx: (W - photo.width * scale) / 2, dy: (H - photo.height * scale) / 2 };
      })()
    : null;
  const toScreen = (f: { left: number; top: number; width: number; height: number }): Point | null =>
    fit && { x: (f.left + f.width / 2) * fit.scale + fit.dx, y: (f.top + f.height / 2) * fit.scale + fit.dy };

  const capture = async () => {
    if (!camera.current || !ready || phase !== 'live') return;
    setError(null);
    setPhase('processing');
    try {
      const shot = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!shot) throw new Error('No photo returned');
      setPhoto({ uri: shot.uri, width: shot.width, height: shot.height });

      const scale = Math.max(W / shot.width, H / shot.height);
      const dx = (W - shot.width * scale) / 2;
      const dy = (H - shot.height * scale) / 2;
      const focusInImage: Rect = {
        left: (focus.left - dx) / scale,
        top: (focus.top - dy) / scale,
        width: focus.width / scale,
        height: focus.height / scale,
      };

      const result = await readTag(shot.uri, shot, focusInImage);
      setScan(result);
      setName(result.name ?? '');
      setPrice(result.price != null ? result.price.toFixed(2) : '');
      if (!result.name && result.price == null) setError('No text found. Fill it in below or retake.');
      else if (result.price == null) setError('Couldn’t read a price — enter it below.');
      setPhase('result');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg === NEEDS_SETUP
          ? 'Scanning isn’t set up. Add a free OCR.space key to .env.local (see README), or use a development build.'
          : 'Couldn’t read that photo. Try again with the price tag in focus, or type it below.',
      );
      setScan(null);
      setPhase('result');
    }
  };

  const retake = () => {
    setPhoto(null);
    setScan(null);
    setError(null);
    setName('');
    setPrice('');
    setPhase('live');
  };

  const parsedPrice = parseMoney(price);
  const valid = name.trim().length > 0 && parsedPrice !== null;

  const add = (scanAnother: boolean) => {
    if (!valid) return;
    // Appends to the auto-detected category; Spent / Remaining / progress update from the store instantly.
    addItem({ name: name.trim(), price: parsedPrice!, source: 'scan' });
    if (scanAnother) retake();
    else router.back();
  };

  if (!permission) return <View style={styles.black} />;

  if (!permission.granted) {
    return (
      <View style={[styles.black, styles.center, { padding: 32 }]}>
        <Ionicons name="camera-outline" size={56} color="#fff" />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permBody}>SmartCart reads product names and price tags so you can add items without typing.</Text>
        {permission.canAskAgain ? (
          <Pressable style={styles.primary} onPress={requestPermission}>
            <Text style={styles.primaryText}>Allow camera</Text>
          </Pressable>
        ) : (
          <Text style={styles.permBody}>Enable camera access for SmartCart in Settings.</Text>
        )}
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold }}>Not now</Text>
        </Pressable>
      </View>
    );
  }

  const nameDot = scan?.nameFrame ? toScreen(scan.nameFrame) : null;
  const priceDot = scan?.priceFrame ? toScreen(scan.priceFrame) : null;
  const showResult = phase === 'result';

  return (
    <View
      style={styles.black}
      onLayout={(e) => setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <StatusBar style="light" />
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        animateShutter={false}
        onCameraReady={() => setReady(true)}
        onMountError={() => setError('Camera unavailable on this device.')}
      />
      {photo ? <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}

      <Brackets rect={focus} />

      {showResult && nameDot && scan?.name ? (
        <Callout dot={nameDot} text={scan.name} side="right" screenW={W} screenH={H} />
      ) : null}
      {showResult && priceDot && scan?.price != null ? (
        <Callout dot={priceDot} text={money(scan.price)} side="left" screenW={W} screenH={H} />
      ) : null}

      {/* Top bar: close (left) / Retake (right) */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close scanner">
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        {phase !== 'live' ? (
          <Pressable onPress={retake} hitSlop={12} style={styles.retake} accessibilityLabel="Retake">
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>
        ) : null}
      </View>

      {phase === 'live' ? (
        <View style={[styles.hint, { top: insets.top + 56 }]}>
          <Text style={styles.hintTitle}>Add Items Without Typing</Text>
          <Text style={styles.hintBody}>Fit the product and its price tag inside the frame</Text>
        </View>
      ) : null}

      {phase === 'processing' ? (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={[styles.hintBody, { marginTop: 12 }]}>Reading label…</Text>
        </View>
      ) : null}

      {phase === 'live' ? (
        <Pressable
          onPress={capture}
          disabled={!ready}
          style={({ pressed }) => [
            styles.shutter,
            { bottom: insets.bottom + 32, opacity: ready ? 1 : 0.5 },
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
          accessibilityLabel="Scan"
        />
      ) : null}

      {showResult ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.cardWrap}
          pointerEvents="box-none"
        >
          <View style={[styles.card, { paddingBottom: insets.bottom + 16 }]}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.fields}>
              <TextInput
                style={[styles.input, { flex: 1.6 }]}
                value={name}
                onChangeText={setName}
                placeholder="Product name"
                placeholderTextColor={colors.textFaint}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={price}
                onChangeText={setPrice}
                placeholder="$0.00"
                placeholderTextColor={colors.textFaint}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.meta}>
              {name.trim() ? `${categorize(name)} · ` : ''}
              {parsedPrice !== null
                ? `Remaining after: ${money(remaining - parsedPrice)}`
                : `Remaining: ${money(remaining)}`}
            </Text>
            <Pressable onPress={() => add(false)} disabled={!valid} style={[styles.primary, !valid && { opacity: 0.4 }]}>
              <Text style={styles.primaryText}>Add to list{parsedPrice !== null ? ` · ${money(parsedPrice)}` : ''}</Text>
            </Pressable>
            <Pressable onPress={() => add(true)} disabled={!valid} style={[styles.secondary, !valid && { opacity: 0.4 }]}>
              <Text style={styles.secondaryText}>Add & scan another</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

/** Four L-shaped corner brackets marking the scan target. */
function Brackets({ rect }: { rect: Rect }) {
  const size = 28;
  const corner = (pos: object, borders: object) => (
    <View style={[{ position: 'absolute', width: size, height: size, borderColor: colors.lime, borderRadius: 4 }, pos, borders]} />
  );
  return (
    <View pointerEvents="none" style={[styles.brackets, rect]}>
      {corner({ left: 0, top: 0 }, { borderLeftWidth: 3, borderTopWidth: 3 })}
      {corner({ right: 0, top: 0 }, { borderRightWidth: 3, borderTopWidth: 3 })}
      {corner({ left: 0, bottom: 0 }, { borderLeftWidth: 3, borderBottomWidth: 3 })}
      {corner({ right: 0, bottom: 0 }, { borderRightWidth: 3, borderBottomWidth: 3 })}
    </View>
  );
}

/** A dot on the detected text, a leader line, and a floating label ("Potato chips", "$2.99"). */
function Callout({
  dot,
  text,
  side,
  screenW,
  screenH,
}: {
  dot: Point;
  text: string;
  side: 'left' | 'right';
  screenW: number;
  screenH: number;
}) {
  const [labelW, setLabelW] = useState(0);
  const labelH = 40;
  const dir = side === 'right' ? 1 : -1;
  // Name label floats up-right of its dot, price label down-left — like the shelf-tag mockup.
  const rawX = dot.x + dir * 70;
  // Keep labels clear of the top bar and the bottom confirm card.
  const y = Math.min(Math.max(dot.y + (side === 'right' ? -90 : 90), 110), screenH - 360);
  const boxLeft = Math.min(Math.max(side === 'right' ? rawX : rawX - labelW, 12), screenW - labelW - 12);
  const end = { x: side === 'right' ? boxLeft + 12 : boxLeft + labelW - 12, y: y + labelH / 2 };

  const dxl = end.x - dot.x;
  const dyl = end.y - dot.y;
  const len = Math.hypot(dxl, dyl);
  const angle = Math.atan2(dyl, dxl);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: (dot.x + end.x) / 2 - len / 2,
          top: (dot.y + end.y) / 2 - 1,
          width: len,
          height: 2,
          backgroundColor: '#fff',
          transform: [{ rotate: `${angle}rad` }],
        }}
      />
      <View style={[styles.dot, { left: dot.x - 7, top: dot.y - 7 }]} />
      <View
        onLayout={(e) => setLabelW(e.nativeEvent.layout.width)}
        style={[styles.label, { left: boxLeft, top: y, height: labelH, opacity: labelW ? 1 : 0 }]}
      >
        <Text style={styles.labelText} numberOfLines={1}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  retakeText: { color: '#fff', fontSize: 15, fontFamily: fonts.semibold },
  hint: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  hintTitle: { color: '#fff', fontSize: 34, fontFamily: fonts.display, letterSpacing: -0.5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8 },
  hintBody: { color: '#fff', fontSize: 14, fontFamily: fonts.medium, marginTop: 4, opacity: 0.9, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  brackets: { position: 'absolute' },
  shutter: {
    position: 'absolute',
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.lime,
    borderWidth: 6,
    borderColor: 'rgba(245,242,234,0.35)',
  },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    position: 'absolute',
    maxWidth: 220,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  labelText: { fontSize: 17, color: colors.text, fontFamily: fonts.bold },
  cardWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  card: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  error: { color: colors.danger, marginBottom: 10, fontSize: 14, fontFamily: fonts.semibold },
  fields: { flexDirection: 'row', gap: 10 },
  input: {
    minWidth: 0, // web <input> has an intrinsic width that otherwise overflows flex rows
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  meta: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium, marginTop: 10, marginBottom: 4 },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryText: { color: colors.onBrand, fontSize: 16, fontFamily: fonts.bold },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: colors.brand, fontSize: 15, fontFamily: fonts.bold },
  permTitle: { color: '#fff', fontSize: 34, fontFamily: fonts.display, marginTop: 16 },
  permBody: { color: '#ddd', fontSize: 15, fontFamily: fonts.medium, textAlign: 'center', marginTop: 8, marginBottom: 16, lineHeight: 21 },
});
