// RS Yoga design tokens — ported from colors_and_type.css
import { StyleSheet } from 'react-native';

export const colors = {
  bg:           '#F5F1ED',
  card:         '#FFFFFF',
  fg:           '#2C2420',
  fgMuted:      '#8B8278',
  fgSubtle:     '#A89F91',
  primary:      '#6B7563',
  primaryFg:    '#FFFFFF',
  primarySoft:  'rgba(107, 117, 99, 0.10)',
  gold:         '#B8923F',
  goldSoft:     'rgba(184, 146, 63, 0.12)',
  muted:        '#E8E4DF',
  mutedFg:      '#8B8278',
  destructive:  '#D14343',
  border:       'rgba(139, 130, 120, 0.20)',
  borderStrong: 'rgba(139, 130, 120, 0.40)',
} as const;

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
} as const;

export const radii = {
  sm: 8, md: 10, lg: 12, xl: 16, full: 9999,
} as const;

export const fontSize = {
  xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, display: 36,
} as const;

// System fonts — Cormorant Garamond and Inter ship via @expo-google-fonts (add later)
// For now, Georgia → serif display, System → UI sans
export const fonts = {
  serif: 'Georgia',
  sans:  undefined as string | undefined, // system default
} as const;

export const shadow = StyleSheet.create({
  sm: {
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
});
