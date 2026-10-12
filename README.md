# SmartCart

A native iOS/Android grocery list with a live budget tracker and an OCR price-tag scanner.
Built with Expo SDK 57, Expo Router, Zustand, `expo-camera` and Google ML Kit text recognition.

## Project structure

```
src/
  app/
    _layout.tsx        Stack navigator (scan opens as a full-screen modal)
    index.tsx          "Weekly Groceries": app bar, sticky budget card, categorized list, bottom bar
    scan.tsx           Camera + scan brackets + ML Kit OCR + floating labels + Retake / Add
  components/
    BudgetCard.tsx     Budget / Spent / Remaining + animated progress bar
    ItemRow.tsx        Circle check, name, "$5.49 · ×1 · jar"
    BottomBar.tsx      Mic · green + · scanner
    ItemSheet.tsx      Add / edit item (price, qty, unit, category)
    DetailsSheet.tsx   Edit budget, list name, store
    MenuSheet.tsx      Overflow menu actions
    Sheet.tsx          Bottom-sheet modal
  lib/
    ocr.ts             ML Kit result -> { name, price } (ignores unit prices, tag noise)
    categorize.ts      Keyword-based category guess ("Potato chips" -> SNACKS)
    format.ts          Currency helpers
  store/useListStore.ts  Zustand store, persisted to AsyncStorage
```

**Budget logic:** Spent is the sum of `price × qty` across every item on the list. Adding or scanning an
item updates Spent, Remaining and the progress bar right away. The bar turns red and "Remaining" changes to "Over by" when you go over budget.
The circle on each row marks an item as picked up.

## Scanning in Expo Go (free cloud fallback)

When ML Kit isn't linked (Expo Go), the scanner uploads the cropped photo to the free
[OCR.space](https://ocr.space/ocrapi) API (`src/lib/cloudScan.ts`) and runs the same parser on the
result. Get a free key (25,000 scans/month) and put it in `.env.local` (git-ignored):

```
EXPO_PUBLIC_OCR_SPACE_KEY=your-key
```

Restart `npx expo start` after editing it. `EXPO_PUBLIC_` values are baked into the JS bundle, so
use this for personal testing only. Development builds keep using on-device ML Kit.

## Web app (installable on iPhone, free)

The same code runs in the browser. Build it with `npx expo export -p web` (output in `dist/`).
It's deployed on Vercel from GitHub (`vercel.json`): every push to `master` updates the site.
Set `EXPO_PUBLIC_OCR_SPACE_KEY` in the Vercel project's Environment Variables so scanning works —
note the key is visible in the site's JavaScript.

iPhone users open the site in **Safari → Share → Add to Home Screen**; it then opens full-screen
like an app. Lists are saved in that browser only. The camera needs HTTPS (Vercel provides it).

## Run on a device (development build)

ML Kit is a native module, so on-device scanning **does not run in Expo Go**. Use a development build:

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build:configure        # links the project to your Expo account (once)

# Android dev build (.apk) — install it, then:
npx eas-cli@latest build -p android --profile development
# iOS dev build (registered device; needs an Apple Developer account)
npx eas-cli@latest device:create
npx eas-cli@latest build -p ios --profile development

npx expo start --dev-client
```

To build locally instead, run `npx expo run:android` (requires Android Studio) or `npx expo run:ios` (requires macOS and Xcode).

## Installable binaries (EAS Build)

| Output | Command |
| --- | --- |
| Android `.apk` (sideload / testers) | `npx eas-cli@latest build -p android --profile preview` |
| Android `.aab` (Google Play) | `npx eas-cli@latest build -p android --profile production` |
| iOS `.ipa` ad-hoc (registered devices) | `npx eas-cli@latest build -p ios --profile preview` |
| iOS `.ipa` App Store / TestFlight | `npx eas-cli@latest build -p ios --profile production` |
| Submit to stores | `npx eas-cli@latest submit -p android` / `-p ios` |

The same commands are available as `npm run build:apk`, `build:aab`, `build:ios-device` and `build:ios`.

Before your first store build, change `ios.bundleIdentifier` and `android.package` in `app.json`. They are currently
`com.smartcart.app`.

## Checks

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

`expo-doctor` flags `@react-native-ml-kit/text-recognition` as "untested on New Architecture". The library uses the
legacy `NativeModules` API, which React Native's interop layer still supports. Test scanning on a real device before you ship.
