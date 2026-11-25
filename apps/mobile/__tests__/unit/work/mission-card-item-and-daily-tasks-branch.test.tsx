import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockMutateClaim = jest.fn();
let mockIsPending = false;
jest.mock('@/feature/work/hooks/use-daily-tasks', () => ({
  useClaimDailyTaskReward: () => ({ mutate: mockMutateClaim, isPending: mockIsPending }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    grey: '#64748B',
    backgroundElement: '#FFFFFF',
    border: '#CBD5E1',
    primary: '#0671EB',
  }),
}));

import { MissionCardItem } from '@/feature/work/components/mission-card-item';

describe('MissionCardItem Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
  });

  it('routes across mission actionUrl, special codes, all activity types, and role defaults', async () => {
    const cases: Array<{ props: any; expectedRoute: string }> = [
      { props: { mission: { title: 'Custom', actionUrl: '/custom/path', targetCount: 1, progress: 0 } }, expectedRoute: '/custom/path' },
      { props: { mission: { code: 'VERIFY_3_SIGNS', targetCount: 3, progress: 1 } }, expectedRoute: '/work/submission-review' },
      { props: { mission: { code: 'APPROVED_ANOMALY_REPORT', targetCount: 2, progress: 1 } }, expectedRoute: '/work/recorded-signs' },
      { props: { mission: { code: 'DAILY_STREAK', targetCount: 5, progress: 2 } }, expectedRoute: '/work' },
      { props: { mission: { activityType: 'SURVEY_UPLOAD', targetCount: 2, progress: 1 } }, expectedRoute: '/work/new-survey' },
      { props: { mission: { activityType: 'REVALIDATION_EVIDENCE', targetCount: 2, progress: 1 } }, expectedRoute: '/work/revalidation-map' },
      { props: { mission: { activityType: 'REVIEW_VOTE', targetCount: 2, progress: 1 } }, expectedRoute: '/work/submission-review' },
      { props: { mission: { activityType: 'REVALIDATION_VOTE', targetCount: 2, progress: 1 } }, expectedRoute: '/work/revalidation-review' },
      { props: { mission: { activityType: 'NAV_ROUTE', targetCount: 2, progress: 1 } }, expectedRoute: '/home' },
      { props: { mission: { activityType: 'HAZARD_ALERT', targetCount: 2, progress: 1 } }, expectedRoute: '/work/recorded-signs' },
      { props: { mission: { targetCount: 2, progress: 0 }, role: 'surveyor' }, expectedRoute: '/work/new-survey' },
      { props: { mission: { targetCount: 2, progress: 0 }, role: 'reviewer' }, expectedRoute: '/work/submission-review' },
      { props: { mission: { targetCount: 2, progress: 0 }, role: 'driver' }, expectedRoute: '/home' },
    ];

    for (const c of cases) {
      mockPush.mockClear();
      const { getByText, unmount } = await render(<MissionCardItem {...c.props} />);
      await fireEvent.press(getByText('Làm ngay'));
      expect(mockPush).toHaveBeenCalledWith(c.expectedRoute);
      await unmount();
    }
  });

  it('renders claimable, pending claim, claimed, and finished-without-id states', async () => {
    const claimableCompletion: any = {
      dailyTaskId: 'task-1',
      progress: 3,
      isCompleted: true,
      claimed: false,
      dailyTask: { name: 'Khảo sát 3 tuyến', targetCount: 3, rewardCredits: 25 },
    };

    const screen = await render(<MissionCardItem completion={claimableCompletion} />);
    await fireEvent.press(screen.getByText('Nhận thưởng +25 Credits'));
    expect(mockMutateClaim).toHaveBeenCalledWith('task-1');

    mockIsPending = true;
    await screen.rerender(<MissionCardItem completion={claimableCompletion} />);
    expect(screen.queryByText(/Nhận thưởng/)).toBeNull();

    mockIsPending = false;
    await screen.rerender(
      <MissionCardItem completion={{ ...claimableCompletion, claimed: true }} />,
    );
    expect(screen.getByText('Đã nhận thưởng')).toBeTruthy();

    await screen.rerender(
      <MissionCardItem mission={{ id: 'm-done', title: 'Xong việc', isCompleted: true, progress: 1, targetCount: 1, rewardCredits: 10 }} />,
    );
    expect(screen.getByText('Hoàn thành')).toBeTruthy();
  });
});
