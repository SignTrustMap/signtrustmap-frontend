/**
 * @file responsive.ts
 * @description Device-agnostic responsive scaling engine and breakpoint utilities.
 * Anchored to standard base viewport (390 x 844, iPhone 14/15/16 and standard Android flagships).
 */

import { Dimensions, useWindowDimensions } from 'react-native';

/** Standard base viewport reference dimensions (iPhone 14/15/16 baseline) */
export const BASE_VIEWPORT_WIDTH = 390;
export const BASE_VIEWPORT_HEIGHT = 844;

/**
 * Linearly scales a layout size horizontally based on device window width.
 *
 * @param size - Base pixel dimension designed for 390px viewport.
 * @param width - Custom window width override, defaults to current window width.
 * @returns Rounded scaled pixel value.
 */
export function scale(size: number, width: number = Dimensions.get('window').width): number {
  return Math.round((width / BASE_VIEWPORT_WIDTH) * size);
}

/**
 * Linearly scales a layout size vertically based on device window height.
 *
 * @param size - Base pixel dimension designed for 844px viewport.
 * @param height - Custom window height override, defaults to current window height.
 * @returns Rounded scaled pixel value.
 */
export function verticalScale(size: number, height: number = Dimensions.get('window').height): number {
  return Math.round((height / BASE_VIEWPORT_HEIGHT) * size);
}

/**
 * Moderately scales a dimension with a dampening factor (0.0 to 1.0) to prevent
 * excessive scaling on phablets or tablets (ideal for typography, icons, and radiuses).
 *
 * @param size - Base pixel dimension designed for 390px viewport.
 * @param factor - Damping multiplier (defaults to 0.5 for balanced scaling).
 * @param width - Custom window width override.
 * @returns Dampened scaled pixel value.
 */
export function moderateScale(
  size: number,
  factor: number = 0.5,
  width: number = Dimensions.get('window').width
): number {
  return Math.round(size + (scale(size, width) - size) * factor);
}

/**
 * Moderately scales a vertical dimension with a dampening factor.
 *
 * @param size - Base pixel dimension.
 * @param factor - Damping multiplier (defaults to 0.5).
 * @param height - Custom window height override.
 * @returns Dampened scaled vertical value.
 */
export function moderateVerticalScale(
  size: number,
  factor: number = 0.5,
  height: number = Dimensions.get('window').height
): number {
  return Math.round(size + (verticalScale(size, height) - size) * factor);
}

export interface ResponsiveValues {
  width: number;
  height: number;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  moderateVerticalScale: (size: number, factor?: number) => number;
}

/**
 * Hook providing reactive responsive dimensions and screen classification flags.
 * Automatically updates during device rotation, fold changes, or split-screen adjustments.
 */
export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  const isSmallDevice = height < 700 || width < 375;
  const isMediumDevice = height >= 700 && height < 860 && width < 600;
  const isLargeDevice = height >= 860 && width < 600;
  const isTablet = width >= 600;

  return {
    width,
    height,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    scale: (size: number) => scale(size, width),
    verticalScale: (size: number) => verticalScale(size, height),
    moderateScale: (size: number, factor = 0.5) => moderateScale(size, factor, width),
    moderateVerticalScale: (size: number, factor = 0.5) => moderateVerticalScale(size, factor, height),
  };
}
