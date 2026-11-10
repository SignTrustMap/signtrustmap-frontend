import React from 'react';
import { render, cleanup } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => ({
  useReducedMotion: () => false,
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={`ant-icon-${props.name}`} {...props} />;
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
  }),
}));

import { SurveyScanModal } from '@/feature/upload/components/survey-scan-modal';

describe('SurveyScanModal', () => {
  afterEach(async () => {
    cleanup();
  });

  it('renders image scan modal with progress bar', async () => {
    const mockComplete = jest.fn();
    const mockCancel = jest.fn();

    const { getByLabelText } = await render(
      <SurveyScanModal
        imageUri="file:///data/sign.jpg"
        isVideo={false}
        onComplete={mockComplete}
        onCancel={mockCancel}
      />
    );

    expect(getByLabelText('Ảnh khảo sát đã chọn')).toBeTruthy();
    expect(getByLabelText('Đang quét ảnh')).toBeTruthy();
  });

  it('renders video scan modal variant with loading indicator', async () => {
    const mockComplete = jest.fn();
    const mockCancel = jest.fn();

    const { getByText } = await render(
      <SurveyScanModal
        imageUri="file:///data/video.mp4"
        isVideo={true}
        onComplete={mockComplete}
        onCancel={mockCancel}
      />
    );

    expect(getByText('Đang tải...')).toBeTruthy();
  });
});
