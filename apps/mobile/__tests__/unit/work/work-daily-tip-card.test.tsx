import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import {
  WorkDailyTipCard,
  DAILY_TIPS,
} from '@/feature/work/components/work-daily-tip-card';

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});

// Mock theme hook
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    primary: '#0671EB',
  }),
}));

// Mock expo-router useFocusEffect
let focusCallback: (() => void) | null = null;
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => {
    focusCallback = cb;
  },
}));

describe('WorkDailyTipCard', () => {
  beforeEach(() => {
    focusCallback = null;
  });

  it('renders credit card elements with "BẠN CÓ BIẾT?" badge and signature', async () => {
    const { getByText, getByTestId } = await render(<WorkDailyTipCard initialIndex={0} />);

    expect(getByTestId('work-daily-tip-card')).toBeTruthy();
    expect(getByText('BẠN CÓ BIẾT?')).toBeTruthy();
    expect(getByText('SIGNTRUST MAP')).toBeTruthy();
    expect(getByText('MẸO HÀNG NGÀY')).toBeTruthy();
    expect(
      getByText(
        'Mỗi biển báo được xác minh chính xác sẽ góp phần xây dựng bản đồ giao thông đáng tin cậy hơn.',
      ),
    ).toBeTruthy();
  });

  it('renders correctly with another tip index', async () => {
    const { getByText } = await render(<WorkDailyTipCard initialIndex={1} />);

    expect(getByText(DAILY_TIPS[1])).toBeTruthy();
  });

  it('has a collection of community and surveying tips including the user quote', () => {
    expect(DAILY_TIPS.length).toBeGreaterThanOrEqual(5);
    expect(DAILY_TIPS).toContain(
      'Mỗi biển báo được xác minh chính xác sẽ góp phần xây dựng bản đồ giao thông đáng tin cậy hơn.',
    );
  });
});
