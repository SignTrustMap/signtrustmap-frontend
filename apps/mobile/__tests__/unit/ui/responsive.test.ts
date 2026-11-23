import { renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  useResponsive,
  BASE_VIEWPORT_WIDTH,
  BASE_VIEWPORT_HEIGHT,
} from '@/utils/responsive';

describe('responsive utilities', () => {
  it('correctly calculates linear scale based on base viewport', () => {
    expect(scale(100, BASE_VIEWPORT_WIDTH)).toBe(100);
    expect(scale(100, BASE_VIEWPORT_WIDTH * 2)).toBe(200);
    expect(scale(100, BASE_VIEWPORT_WIDTH / 2)).toBe(50);
    // Uses Dimensions.get by default
    expect(typeof scale(100)).toBe('number');
  });

  it('correctly calculates vertical scale based on base viewport', () => {
    expect(verticalScale(100, BASE_VIEWPORT_HEIGHT)).toBe(100);
    expect(verticalScale(100, BASE_VIEWPORT_HEIGHT * 2)).toBe(200);
    expect(verticalScale(100, BASE_VIEWPORT_HEIGHT / 2)).toBe(50);
    // Uses Dimensions.get by default
    expect(typeof verticalScale(100)).toBe('number');
  });

  it('moderately scales dimensions with custom dampening factor', () => {
    // factor = 0 means unscaled
    expect(moderateScale(100, 0, 780)).toBe(100);
    // factor = 1 means fully scaled
    expect(moderateScale(100, 1, 780)).toBe(200);
    // factor = 0.5 (default)
    expect(moderateScale(100, 0.5, 780)).toBe(150);
    expect(typeof moderateScale(100)).toBe('number');
  });

  it('moderately scales vertical dimensions with dampening factor', () => {
    expect(moderateVerticalScale(100, 0, 1688)).toBe(100);
    expect(moderateVerticalScale(100, 1, 1688)).toBe(200);
    expect(moderateVerticalScale(100, 0.5, 1688)).toBe(150);
    expect(typeof moderateVerticalScale(100)).toBe('number');
  });

  describe('useResponsive hook', () => {
    it('categorizes small device correctly', async () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 320, height: 600, scale: 2, fontScale: 1 });
      const { result } = await renderHook(() => useResponsive());

      expect(result.current.isSmallDevice).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.scale(10)).toBeDefined();
      expect(result.current.verticalScale(10)).toBeDefined();
      expect(result.current.moderateScale(10)).toBeDefined();
      expect(result.current.moderateVerticalScale(10)).toBeDefined();
    });

    it('categorizes medium and tablet devices', async () => {
      // Tablet width >= 600
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 768, height: 1024, scale: 2, fontScale: 1 });
      const { result: tabletRes } = await renderHook(() => useResponsive());
      expect(tabletRes.current.isTablet).toBe(true);

      // Medium device
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 400, height: 800, scale: 2, fontScale: 1 });
      const { result: medRes } = await renderHook(() => useResponsive());
      expect(medRes.current.isMediumDevice).toBe(true);

      // Large device
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 430, height: 932, scale: 2, fontScale: 1 });
      const { result: largeRes } = await renderHook(() => useResponsive());
      expect(largeRes.current.isLargeDevice).toBe(true);
    });
  });
});
