import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

jest.mock('@/components/image-inspection-modal', () => {
  const { View, Text } = require('react-native');
  return {
    ImageInspectionModal: ({ visible, title }: any) =>
      visible ? (
        <View testID="mock-inspection-modal">
          <Text>{title}</Text>
        </View>
      ) : null,
  };
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
    placeholder: '#94A3B8',
    danger: '#EF4444',
  }),
}));

import { NavigationSignVerifyCard } from '@/components/navigation-sign-verify-card';

const sampleSign = {
  id: 'sign-101',
  name: 'Biển Cấm Rẽ Trái',
  signCode: 'P.123',
  imageUrl: 'https://example.com/p123.png',
  actualCropUrl: 'https://example.com/crop.png',
  coordinate: [106.7, 10.77] as [number, number],
  roadName: 'Đường Nguyễn Huệ',
};

describe('NavigationSignVerifyCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.clearAllTimers();
    jest.useRealTimers();
    cleanup();
    jest.clearAllMocks();
  });

  it('renders null when sign is undefined or null', async () => {
    const { toJSON } = await render(
      <NavigationSignVerifyCard
        sign={null}
        distanceMeters={50}
        onVerify={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(toJSON()).toBeNull();
  });

  it('renders sign info, distance, and confirm question when sign is provided', async () => {
    const { getByText } = await render(
      <NavigationSignVerifyCard
        sign={sampleSign as any}
        distanceMeters={45}
        onVerify={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(getByText('BIỂN BÁO PHÍA TRƯỚC · 45M')).toBeTruthy();
    expect(getByText('Biển Cấm Rẽ Trái')).toBeTruthy();
    expect(getByText('ẢNH XÁC THỰC')).toBeTruthy();
    expect(getByText('Biển báo này có trên đường không?')).toBeTruthy();
  });

  it('calls onVerify with "present" when Có button is pressed', async () => {
    const mockVerify = jest.fn();
    const { getByLabelText } = await render(
      <NavigationSignVerifyCard
        sign={sampleSign as any}
        distanceMeters={45}
        onVerify={mockVerify}
        onDismiss={jest.fn()}
      />
    );

    const yesBtn = getByLabelText('Có, biển báo vẫn có trên đường');
    fireEvent.press(yesBtn);

    expect(mockVerify).toHaveBeenCalledWith(sampleSign, 'present');
  });

  it('calls onVerify with "absent" when Không button is pressed', async () => {
    const mockVerify = jest.fn();
    const { getByLabelText } = await render(
      <NavigationSignVerifyCard
        sign={sampleSign as any}
        distanceMeters={45}
        onVerify={mockVerify}
        onDismiss={jest.fn()}
      />
    );

    const noBtn = getByLabelText('Không, không thấy biển báo');
    fireEvent.press(noBtn);

    expect(mockVerify).toHaveBeenCalledWith(sampleSign, 'absent');
  });

  it('calls onDismiss when close button (✕) is tapped', async () => {
    const mockDismiss = jest.fn();
    const { getByLabelText } = await render(
      <NavigationSignVerifyCard
        sign={sampleSign as any}
        distanceMeters={45}
        onVerify={jest.fn()}
        onDismiss={mockDismiss}
      />
    );

    const closeBtn = getByLabelText('Bỏ qua xác minh biển báo');
    fireEvent.press(closeBtn);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('opens photo inspection modal when tapping on image', async () => {
    const { getByLabelText, getByTestId } = await render(
      <NavigationSignVerifyCard
        sign={sampleSign as any}
        distanceMeters={45}
        onVerify={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    const imgWrap = getByLabelText('Tap to view full verification photo');
    await act(async () => {
      fireEvent.press(imgWrap);
    });

    expect(getByTestId('mock-inspection-modal')).toBeTruthy();
  });

  it('automatically triggers onDismiss after 20 seconds timeout', async () => {
    const mockDismiss = jest.fn();
    await render(
      <NavigationSignVerifyCard
        sign={sampleSign as any}
        distanceMeters={45}
        onVerify={jest.fn()}
        onDismiss={mockDismiss}
      />
    );

    act(() => {
      jest.advanceTimersByTime(20500);
    });

    expect(mockDismiss).toHaveBeenCalled();
  });
});
