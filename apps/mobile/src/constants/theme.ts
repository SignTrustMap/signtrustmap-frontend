import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  primary: '#000000',
  secondary: '#d3f7ff',
  tertiary: '#148594',
  neutral: '#F8F7F7',
  surface: '#FFFFFF',
  onTertiary: '#FFFFFF',
  border: '#E8E4E3',
  text: '#000000',
  background: '#F8F7F7',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#d3f7ff',
  textSecondary: '#007b8b',
  placeholder: '#888888',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    sans: 'Public Sans',
    body: 'Google Sans',
    title: 'Arvo',
    serif: 'Arvo',
    rounded: 'Google Sans',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Public Sans',
    body: 'Google Sans',
    title: 'Arvo',
    serif: 'Arvo',
    rounded: 'Google Sans',
    mono: 'monospace',
  },
  web: {
    sans: 'Public Sans, var(--font-display)',
    body: 'Google Sans, var(--font-display)',
    title: 'Arvo, var(--font-serif)',
    serif: 'Arvo, var(--font-serif)',
    rounded: 'Google Sans, var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 20,
  five: 24,
  six: 48,
  sm: 8,
  md: 16,
  lg: 24,
} as const;

export const Rounded = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
