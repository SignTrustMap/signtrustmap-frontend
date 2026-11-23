import React from 'react';
import { render } from '@testing-library/react-native';
import {
  Skeleton,
  SkeletonListItem,
  ListSkeleton,
  SearchSuggestionSkeleton,
} from '@/components/skeleton';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    grey: '#94A3B8',
    backgroundElement: '#FFFFFF',
    border: '#E2E8F0',
  }),
}));

describe('Skeleton Components Suite', () => {
  describe('Skeleton Component', () => {
    it('renders with default props and animation', async () => {
      const { toJSON } = await render(<Skeleton />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders with custom width, height, and borderRadius', async () => {
      const { toJSON } = await render(
        <Skeleton borderRadius={12} height={40} width={120} />
      );
      const json: any = toJSON();
      expect(json.props.style).toEqual(
        expect.objectContaining({
          width: 120,
          height: 40,
          borderRadius: 12,
        })
      );
    });
  });

  describe('SkeletonListItem Component', () => {
    it('renders card variant with thumbnail and 2 lines by default', async () => {
      const { toJSON } = await render(<SkeletonListItem />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders row variant without thumbnail and with extra lines (> 2)', async () => {
      const { toJSON } = await render(
        <SkeletonListItem
          lines={4}
          showThumbnail={false}
          variant="row"
        />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('ListSkeleton Component', () => {
    it('renders list of skeleton items with default accessibility role', async () => {
      const { getByRole, getByLabelText } = await render(
        <ListSkeleton count={3} />
      );

      expect(getByRole('progressbar')).toBeTruthy();
      expect(getByLabelText('Đang tải dữ liệu danh sách…')).toBeTruthy();
    });

    it('renders with custom accessibility label, gap, and itemStyle', async () => {
      const { getByLabelText } = await render(
        <ListSkeleton
          accessibilityLabel="Đang tải dữ liệu địa điểm"
          count={2}
          gap={16}
          itemStyle={{ opacity: 0.8 }}
          lines={3}
          showThumbnail={false}
          variant="row"
        />
      );

      expect(getByLabelText('Đang tải dữ liệu địa điểm')).toBeTruthy();
    });
  });

  describe('SearchSuggestionSkeleton Component', () => {
    it('renders multiple suggestion items with alternating widths', async () => {
      const { toJSON } = await render(
        <SearchSuggestionSkeleton circleSize={40} count={4} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
