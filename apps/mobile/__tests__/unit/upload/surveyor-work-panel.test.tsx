import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useGetMyPendingSubmissions, useGetMySurveyStats } from '@/feature/upload/hooks/use-survey-submission';
import { useGetFirstRevalidationSign } from '@/feature/revalidation/hooks/use-revalidation';
import { fetchFirstRevalidationSign } from '@/api/revalidation/revalidation';
import { SurveyorWorkPanel } from '@/feature/upload/components/surveyor-work-panel';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetMyPendingSubmissions: jest.fn(),
  useGetMySurveyStats: jest.fn(),
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetFirstRevalidationSign: jest.fn(),
}));

jest.mock('@/api/revalidation/revalidation', () => ({
  fetchFirstRevalidationSign: jest.fn(),
}));

jest.mock('@/feature/work/components/work-action-card', () => {
  const { Pressable, Text, View } = require('react-native');
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
    (useGetFirstRevalidationSign as jest.Mock).mockReturnValue({
      data: null,
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

  it('navigates to revalidation map with sign params when first sign hook has data', async () => {
    const mockSign = {
      id: 'sign-101',
      coordinate: [106.7009, 10.7769],
      type: 'PROHIBITORY',
    };
    (useGetFirstRevalidationSign as jest.Mock).mockReturnValue({
      data: mockSign,
    });

    const { getByText } = await render(<SurveyorWorkPanel />);

    await act(async () => {
      fireEvent.press(getByText('Bản đồ tái thẩm định'));
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/work/revalidation-map',
        params: expect.objectContaining({
          autoSelectFirst: 'true',
          selectedSignId: 'sign-101',
          snapLon: '106.7009',
          snapLat: '10.7769',
        }),
      })
    );
  });

  it('fetches first sign on demand if hook data is null', async () => {
    const fetchedSign = {
      id: 'sign-202',
      coordinate: [106.68, 10.76],
    };
    (fetchFirstRevalidationSign as jest.Mock).mockResolvedValue(fetchedSign);

    const { getByText } = await render(<SurveyorWorkPanel />);

    await act(async () => {
      fireEvent.press(getByText('Bản đồ tái thẩm định'));
    });

    expect(fetchFirstRevalidationSign).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/work/revalidation-map',
        params: expect.objectContaining({
          selectedSignId: 'sign-202',
        }),
      })
    );
  });

  it('navigates to revalidation map without sign params when fallback fetch fails', async () => {
    (fetchFirstRevalidationSign as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByText } = await render(<SurveyorWorkPanel />);

    await act(async () => {
      fireEvent.press(getByText('Bản đồ tái thẩm định'));
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/work/revalidation-map',
        params: {
          autoSelectFirst: 'true',
          snapRequestId: expect.any(String),
        },
      })
    );
  });
});
