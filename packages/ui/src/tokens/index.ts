/**
 * SignTrustMap Design Tokens System
 * Single Source of Truth (SSOT) for spacing, sizing, radius, typography, and elevation
 * used across both Web (Community Portal) and Ops (Command Center).
 */

/**
 * Standard corner radius scale (in pixels and Tailwind utility equivalents).
 * Strictly adheres to 4px/8px incremental aesthetic:
 * - `sm` (4px): Micro elements, tags, tooltips
 * - `md` (8px): Badges, small chips, compact controls
 * - `lg` (12px): Standard buttons, input fields, dropdown items
 * - `xl` (16px): Content cards, widgets, list containers
 * - `2xl` (20px): Large dashboard cards, featured sections
 * - `3xl` (24px): Dialogs, modals, hero panels
 * - `pill` (9999px): Fully rounded avatars, status pills
 */
export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  pill: '9999px',
} as const

export type RadiusToken = keyof typeof RADIUS

/**
 * Standard spatial scale for padding, margin, and gap.
 * Based on 4px / 8px Grid System to ensure visual rhythm.
 */
export const SPACING = {
  '2xs': '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
  '5xl': '64px',
} as const

export type SpacingToken = keyof typeof SPACING

/**
 * Standard fixed component heights.
 * Ensures vertical alignment between inputs, buttons, and table rows.
 */
export const HEIGHTS = {
  /** 32px: Dense table buttons, micro controls, toolbar actions */
  controlSm: '32px',
  /** 40px: Standard form inputs, buttons, select menus */
  controlMd: '40px',
  /** 48px: Large CTA buttons, touch-first mobile targets (Apple HIG minimum 44px) */
  controlLg: '48px',
  /** 40px: High-density operations table row */
  tableRowDense: '40px',
  /** 52px: Standard data table row */
  tableRowStandard: '52px',
  /** 64px: Relaxed table row with avatar or multi-line text */
  tableRowRelaxed: '64px',
  /** 64px: Fixed top navigation bar height */
  navbar: '64px',
} as const

/**
 * Standard Z-Index hierarchy scale.
 * Prevents map popups (Leaflet) from overlapping floating headers, menus, or modals.
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  drawer: 30,
  backdrop: 40,
  modal: 50,
  toast: 100,
  tooltip: 110,
} as const

export type ZIndexToken = keyof typeof Z_INDEX

/**
 * Core brand colors & semantic theme definitions.
 */
export const COLORS = {
  brand: {
    teal: '#007b8b',
    tealDark: '#00606d',
    cyan: '#00c4de',
    cyanLight: '#38dbf1',
    sky: '#d3f7ff',
    neutral: '#F8F7F7',
  },
  dark: {
    bg: '#030708',
    surface: '#071317',
    card: '#0A171C',
    border: 'rgba(255, 255, 255, 0.10)',
    borderHover: 'rgba(0, 196, 222, 0.35)',
  },
  light: {
    bg: '#F8F7F7',
    surface: '#FFFFFF',
    border: '#E8E4E3',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
  },
} as const
