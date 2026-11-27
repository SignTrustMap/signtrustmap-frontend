import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useGetMyPendingSubmissions, useGetMySurveyStats } from '@/feature/upload/hooks/use-survey-submission';
import { SurveyorWorkPanel } from '@/feature/upload/components/surveyor-work-panel';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetMyPendingSubmissions: jest.fn(),
  useGetMySurveyStats: jest.fn(),
}));

jest.mock('@/feature/work/components/work-action-card', () => {
  const { Pressable, Text } = require('react-native');
  return {
    WorkActionCard: ({ label, count, onPress }: any) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{label}</Text>
        <Text>{count !== undefined ? String(count) : '0'}</Text>
      </Pressable>
    ),
  };
});

describe('SurveyorWorkPanel Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useGetMyPendingSubmissions as jest.Mock).mockReturnValue({
      data: { pending: 3 },
    });
    (useGetMySurveyStats as jest.Mock).mockReturnValue({
      data: { revalidationAvailable: 8 },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders pending and revalidation stats counts', async () => {
    const { getByText } = await render(<SurveyorWorkPanel />);

    expect(getByText('Hồ sơ đang xử lý')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Bản đồ tái thẩm định')).toBeTruthy();
    expect(getByText('8')).toBeTruthy();
  });

  it('navigates to survey history when pending card is tapped', async () => {
    const { getByText } = await render(<SurveyorWorkPanel />);

    await act(async () => {
      fireEvent.press(getByText('Hồ sơ đang xử lý'));
    });

    expect(mockPush).toHaveBeenCalledWith('/work/survey-history');
  });

  it('navigates to revalidation map without sign params when revalidation card is tapped', async () => {
    const { getByText } = await render(<SurveyorWorkPanel />);

    await act(async () => {
      fireEvent.press(getByText('Bản đồ tái thẩm định'));
    });

    expect(mockPush).toHaveBeenCalledWith('/work/revalidation-map');
  });
});
