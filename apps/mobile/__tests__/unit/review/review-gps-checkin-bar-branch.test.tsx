import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (p: any) => <View testID={`mc-${p.name}`} {...p} />,
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    surface: '#FFFFFF',
    border: '#E2E8F0',
    primary: '#2563EB',
    placeholder: '#94A3B8',
  }),
}));

import { ReviewGpsCheckInBar } from '@/feature/review/components/review-gps-checkin-bar';
import type { CandidateCheckInResponse, ReviewerQuestClaim } from '@/types/bountyBoardType';

describe('ReviewGpsCheckInBar branch coverage', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  const baseCheckIn: CandidateCheckInResponse = {
    eligible: true,
    canVote: true,
    candidateId: 'cand-1',
    candidateStatus: 'PENDING',
    distanceMeters: 22.4,
    maxGeofenceRadius: 50,
    isWithinProximity: true,
    remainingDistanceMeters: 0,
    message: 'OK',
  };

  const baseClaim: ReviewerQuestClaim = {
    id: 'cl-1',
    reviewerId: 'rev-1',
    targetType: 'CANDIDATE_VALIDATION',
    targetId: 'cand-1',
    status: 'CLAIMED',
    timeLimitMinutes: 120,
    claimedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    completedAt: null,
    baseRewardCredits: 5,
    escalatedBonusCredits: 0,
    penaltyApplied: false,
    penaltyNotes: null,
  };

  it('covers loading, EXPIRED status, past-due countdown, eligible/ineligible states, and actions', async () => {
    jest.useFakeTimers();
    const onRefresh = jest.fn();
    const onNavigate = jest.fn();

    // 1. Loading & no checkIn yet
    const screen = await render(
      <ReviewGpsCheckInBar
        checkIn={null}
        loading
        onRefreshLocation={onRefresh}
      />,
    );
    expect(screen.getByText('Đang kiểm tra vị trí hiện tại...')).toBeTruthy();

    // 2. Expired claim status
    await screen.rerender(
      <ReviewGpsCheckInBar
        checkIn={baseCheckIn}
        loading={false}
        claim={{ ...baseClaim, status: 'EXPIRED' }}
        onRefreshLocation={onRefresh}
      />,
    );
    expect(screen.getByText('Nhiệm vụ đã hết hạn')).toBeTruthy();

    // 3. Past expiresAt date
    await screen.rerender(
      <ReviewGpsCheckInBar
        checkIn={baseCheckIn}
        loading={false}
        claim={{ ...baseClaim, expiresAt: new Date(Date.now() - 5000).toISOString() }}
        onRefreshLocation={onRefresh}
      />,
    );
    expect(screen.getByText('Nhiệm vụ đã hết hạn')).toBeTruthy();

    // 4. Eligible with distance + active claim countdown tick
    await screen.rerender(
      <ReviewGpsCheckInBar
        checkIn={baseCheckIn}
        loading={false}
        claim={baseClaim}
        onRefreshLocation={onRefresh}
      />,
    );
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(screen.getByText('Vị trí hợp lệ để đánh giá')).toBeTruthy();
    expect(screen.getByText('Bạn đang cách biển báo 22 mét.')).toBeTruthy();
    expect(screen.getByText(/Thời gian còn lại:/)).toBeTruthy();

    // 5. Not eligible with remaining distance + navigate button
    await screen.rerender(
      <ReviewGpsCheckInBar
        checkIn={{ ...baseCheckIn, eligible: false, distanceMeters: 120, remainingDistanceMeters: 70 }}
        loading={false}
        onNavigateToSign={onNavigate}
        onRefreshLocation={onRefresh}
      />,
    );
    expect(screen.getByText('Chưa đủ điều kiện vị trí')).toBeTruthy();
    expect(screen.getByText(/di chuyển lại gần thêm 70 mét/)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Chỉ đường tới biển báo'));
    expect(onNavigate).toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Lấy lại vị trí'));
    expect(onRefresh).toHaveBeenCalled();

    // 6. Not eligible with null distances + default fallback (null checkIn, not loading)
    await screen.rerender(
      <ReviewGpsCheckInBar
        checkIn={{ ...baseCheckIn, eligible: false, distanceMeters: null, remainingDistanceMeters: null }}
        loading={false}
        onRefreshLocation={onRefresh}
      />,
    );
    expect(screen.getByText(/trong phạm vi 50 mét/)).toBeTruthy();

    await screen.rerender(
      <ReviewGpsCheckInBar
        checkIn={null}
        loading={false}
        onRefreshLocation={onRefresh}
      />,
    );
    expect(screen.getByText('Vị trí hợp lệ để đánh giá')).toBeTruthy();

    jest.useRealTimers();
  });
});
