import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkActionBadge, WorkActionCard } from '@/feature/work/components/work-action-badge';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name, ...props }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: `icon-${name}`, ...props });
  },
}));

jest.mock('expo-symbols', () => ({
  SymbolView: ({ name, ...props }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: `symbol-${name}`, ...props });
  },
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    primary: '#0671EB',
    secondary: '#E8F4F6',
    danger: '#EF4444',
    backgroundElement: '#FFFFFF',
    text: '#1E293B',
  }),
}));

describe('WorkActionBadge & WorkActionCard Component', () => {
  it('renders default badge with label and handles press event', async () => {
    const handlePress = jest.fn();
    const { getByText, getByRole } = await render(
      <WorkActionBadge
        label="Nhiệm vụ mới"
        onPress={handlePress}
      />
    );

    expect(getByText('Nhiệm vụ mới')).toBeTruthy();

    const button = getByRole('button');
    fireEvent.press(button);

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('renders count badge and formatted accessibility label when count > 0', async () => {
    const { getByText, getByLabelText } = await render(
      <WorkActionBadge
        count={5}
        label="Đánh giá chờ"
      />
    );

    expect(getByText('Đánh giá chờ')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByLabelText('Đánh giá chờ, 5 items')).toBeTruthy();
  });

  it('renders badge with custom text badgeLabel', async () => {
    const { getByText } = await render(
      <WorkActionBadge
        badgeLabel="MỚI"
        label="Tính năng mới"
      />
    );

    expect(getByText('Tính năng mới')).toBeTruthy();
    expect(getByText('MỚI')).toBeTruthy();
  });

  it('renders with urgent style when urgent is true', async () => {
    const { getByTestId } = await render(
      <WorkActionBadge
        label="Khẩn cấp"
        testID="urgent-badge"
        urgent
      />
    );

    expect(getByTestId('urgent-badge')).toBeTruthy();
  });

  it('renders with symbol when icon is empty or undefined and symbol is provided', async () => {
    const { getByTestId } = await render(
      <WorkActionBadge
        icon={null as any}
        label="Symbol Action"
        symbol="flame.fill"
      />
    );

    expect(getByTestId('symbol-flame.fill')).toBeTruthy();
  });

  it('renders fallback map-marker icon when both icon and symbol are falsy', async () => {
    const { getByTestId } = await render(
      <WorkActionBadge
        icon={'' as any}
        label="Fallback Icon"
      />
    );

    expect(getByTestId('icon-map-marker')).toBeTruthy();
  });

  it('works seamlessly with backward-compatibility alias WorkActionCard', async () => {
    const handlePress = jest.fn();
    const { getByText, getByRole } = await render(
      <WorkActionCard
        accessibilityLabel="Custom accessibility"
        accentColor="#10B981"
        icon="car"
        label="Tài xế"
        onPress={handlePress}
      />
    );

    expect(getByText('Tài xế')).toBeTruthy();

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Custom accessibility');

    fireEvent.press(button);
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});
