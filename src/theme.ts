// "Fresh market editorial": warm paper, deep forest ink, one electric lime accent.
export const colors = {
  bg: '#F5F2EA', // paper
  surface: '#FFFFFF',
  sunken: '#ECE7DB',
  text: '#12201A', // ink
  textMuted: '#5E6B63',
  textFaint: '#9AA39D',
  border: '#E2DCCD',
  brand: '#0F3B2C', // forest
  brandDeep: '#0A2A1F',
  lime: '#C8F25A',
  green: '#2E9E5B',
  greenSoft: '#E3EEDC',
  onBrand: '#F5F2EA',
  onBrandMuted: 'rgba(245,242,234,0.62)',
  danger: '#E2553D',
  overlay: 'rgba(10,22,17,0.5)',
  page: '#E9E4D8', // behind the app column on mid-size screens
};

export const fonts = {
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
};

export const radius = { sm: 12, md: 16, lg: 24, xl: 28, pill: 999 };

export const shadow = {
  shadowColor: '#0A2A1F',
  shadowOpacity: 0.12,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
};

/** Small uppercase label used above headings and numbers. */
export const eyebrow = {
  fontFamily: fonts.bold,
  fontSize: 11,
  letterSpacing: 1.6,
  textTransform: 'uppercase' as const,
};

/** Phone-width column the app is centered in on tablets and mid-size browsers. */
export const MAX_APP_WIDTH = 520;
/** From this width the web app becomes a landing page with the app in a phone frame. */
export const SHOWCASE_MIN_WIDTH = 1024;
