import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());
const mockApiRequest = jest.fn((..._args: unknown[]) => Promise.resolve({}));
const mockJsonApiRequest = jest.fn((..._args: unknown[]) => Promise.resolve({}));
const mockUseGetMySubmissions = jest.fn();

jest.mock('@/api/api-client', () => ({
  API_PATHS: {
    NAVIGATIONS: '/navigations',
    REVIEWS: '/reviews',
    SURVEYORS: '/surveyors',
  },
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  jsonApiRequest: (...args: unknown[]) => mockJsonApiRequest(...args),
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
    back: jest.fn(),
  }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const ReactLocal = require('react');
    ReactLocal.useEffect(() => cb(), [cb]);
  },
}));

jest.mock('@expo/vector-icons', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLocal.createElement(Text, { testID: `ion-${String(props.name)}` }, String(props.name)),
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLocal.createElement(Text, { testID: `mci-${String(props.name)}` }, String(props.name)),
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return (props: Record<string, unknown>) =>
    ReactLocal.createElement(Text, { testID: `ant-${String(props.name)}` }, String(props.name));
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return (props: Record<string, unknown>) =>
    ReactLocal.createElement(Text, { testID: `ion-${String(props.name)}` }, String(props.name));
});

jest.mock('react-native-safe-area-context', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      ReactLocal.createElement(View, props, children),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#ffffff',
    backgroundElement: '#f5f5f5',
    backgroundSelected: '#e5e7eb',
    border: '#d1d5db',
    danger: '#ef4444',
    grey: '#6b7280',
    onPrimary: '#ffffff',
    primary: '#2563eb',
    success: '#10b981',
    text: '#111827',
    warning: '#f59e0b',
  }),
}));

jest.mock('@/hooks/use-back-button', () => ({
  useBackButton: jest.fn(),
}));

jest.mock('@/hooks/use-work-route', () => ({
  useWorkRoute: () => '/(tabs)/work',
}));

jest.mock('@/feature/notifications/hooks/use-notifications', () => ({
  useGetUnreadNotificationCount: () => ({ data: { count: 12 } }),
}));

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetMySubmissions: (...args: unknown[]) => mockUseGetMySubmissions(...args),
}));

jest.mock('@/components/date-filter-sort-list', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return {
    DateFilterSortList: ({
      items,
      getDate,
      children,
    }: {
      items: Array<Record<string, unknown>>;
      getDate?: (item: Record<string, unknown>) => string | undefined;
      children: (ctx: { items: Array<Record<string, unknown>> }) => React.ReactNode;
    }) => {
      items.forEach((item) => getDate?.(item));
      const filtered = (globalThis as Record<string, unknown>).__forceEmptyFilteredList
        ? []
        : items;
      return ReactLocal.createElement(View, null, children({ items: filtered }));
    },
  };
});

jest.mock('@/components/virtual-list', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return {
    VirtualList: ({
      data,
      renderItem,
      ListEmptyComponent,
      keyExtractor,
      refreshControl,
    }: {
      data: Array<Record<string, unknown>>;
      renderItem: (ctx: { item: Record<string, unknown>; index: number }) => React.ReactNode;
      ListEmptyComponent?: React.ReactNode;
      keyExtractor?: (item: Record<string, unknown>, index: number) => string;
      refreshControl?: React.ReactNode;
    }) =>
      ReactLocal.createElement(
        View,
        null,
        refreshControl,
        data.length === 0
          ? ListEmptyComponent
          : data.map((item, index) =>
              ReactLocal.createElement(
                View,
                { key: keyExtractor ? keyExtractor(item, index) : String(index) },
                renderItem({ item, index }),
              ),
            ),
      ),
  };
});

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetMySubmissions: (...args: unknown[]) => mockUseGetMySubmissions(...args),
}));

import {
  readSubmissionId,
  readSubmittedStatus,
} from '@/feature/upload/utils/submission-response';
import {
  createSavedRoute,
  deleteSavedRoute,
  getSavedRoutes,
  getSavedRouteSigns,
  updateSavedRoute,
} from '@/api/navigation/saved-routes';
import {
  castVoteOnSignCandidate,
  getCandidateSignDetails,
  getMyRecaptures,
  getMyReviewerStats,
  getMyReviewHistory,
  getReviewQueue,
  reportCannotIdentifySign,
  reportMissingType,
  reportSignCandidate,
  skipSign,
  submitCandidateRecapture,
  undoVoteOnCandidate,
} from '@/api/reviews/review';
import { WorkDailyTipCard } from '@/feature/work/components/work-daily-tip-card';
import {
  RevalidationEditingBanner,
  RevalidationVotedResultCard,
} from '@/feature/revalidation/components/revalidation-voted-result-card';
import { NavigationTopControls } from '@/feature/navigation/components/navigation-top-controls';
import { ReturnedSubmissionsListScreen } from '@/feature/work/pages/returned-submissions-list-screen';

describe('Batch 5 small utils, APIs, cards, and returned list branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>).__forceEmptyFilteredList = false;
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
  });

  describe('submission-response utils', () => {
    it('reads submissionId across root, id, nested submission, and error branches', () => {
      expect(readSubmissionId({ submissionId: 'sub-1' })).toBe('sub-1');
      expect(readSubmissionId({ id: 'sub-2' })).toBe('sub-2');
      expect(readSubmissionId({ submission: { id: 'sub-3' } })).toBe('sub-3');

      expect(() => readSubmissionId(null)).toThrow();
      expect(() => readSubmissionId(['not-record'])).toThrow();
      expect(() => readSubmissionId({ submissionId: '   ', submission: 'bad' })).toThrow();
    });

    it('reads submitted status and throws descriptive validation/correction errors', () => {
      expect(readSubmittedStatus({ submissionStatus: 'QUEUED' })).toBe('QUEUED');
      expect(readSubmittedStatus({ status: 'COMPLETED' })).toBe('COMPLETED');
      expect(readSubmittedStatus({ submission: { status: 'NO_SIGN_DETECTED' } })).toBe(
        'NO_SIGN_DETECTED',
      );

      expect(() => readSubmittedStatus(null)).toThrow();
      expect(() => readSubmittedStatus({ status: 123, submission: [] })).toThrow();
      expect(() =>
        readSubmittedStatus({
          status: 'REJECTED',
          validationErrors: [{ message: 'Invalid GPS' }, { message: '' }, null],
          correctionRequirements: [{ message: 'Retake photo' }],
          submission: {
            validationErrors: [{ message: 'Too blurry' }],
            correctionRequirements: 'not-array',
          },
        }),
      ).toThrow('Invalid GPS  Retake photo Too blurry');

      expect(() => readSubmittedStatus({ status: 'REJECTED' })).toThrow();
    });
  });

  describe('saved-routes & review API wrappers', () => {
    it('covers getSavedRoutes normalization and CRUD requests', async () => {
      mockApiRequest
        .mockResolvedValueOnce([
          { id: 'r1', name: 'Route A' },
          { id: 'r2', title: 'Route B' },
          { id: 'r3', originName: 'A', destinationName: 'B' },
          { id: 'r4' },
        ])
        .mockResolvedValueOnce({ data: [{ id: 'r5', name: 'Data Route' }] })
        .mockResolvedValueOnce({ routes: [{ id: 'r6', title: 'Routes Prop' }] })
        .mockResolvedValueOnce({ unexpected: true });

      const list1 = await getSavedRoutes('tok');
      expect(list1.map((x) => x.name)).toEqual([
        'Route A',
        'Route B',
        'A ➔ B',
        'Xuất phát ➔ Điểm đến',
      ]);
      expect(await getSavedRoutes('tok')).toHaveLength(1);
      expect(await getSavedRoutes('tok')).toHaveLength(1);
      expect(await getSavedRoutes()).toEqual([]);

      await createSavedRoute(
        { name: 'R', distanceMeters: 120.7, durationSeconds: 45.2 } as never,
        'tok',
      );
      await createSavedRoute(
        { name: 'R2', distanceMeters: Number.NaN } as never,
        undefined,
      );
      await updateSavedRoute(
        'r1',
        { distanceMeters: 50.4, durationSeconds: 12.9 } as never,
        'tok',
      );
      await updateSavedRoute('r1', {} as never);
      await deleteSavedRoute('r1', 'tok');
      await getSavedRouteSigns('r1', 'tok');

      expect(mockJsonApiRequest).toHaveBeenCalledTimes(4);
      expect(mockApiRequest).toHaveBeenCalledTimes(6);
    });

    it('covers all review.ts endpoints and optional parameters', async () => {
      await getReviewQueue({} as never, 'tok');
      await getReviewQueue(
        { page: '2', pageSize: '10', status: 'PENDING', signTypeId: 'P102' } as never,
        'tok',
      );
      await getMyReviewHistory({ page: '1', pageSize: '20' }, 'tok');
      await getMyReviewHistory(
        {
          page: '1',
          pageSize: '20',
          state: 'APPROVED',
          search: 'cam',
          surveyorId: 'u1',
        } as never,
        'tok',
      );
      await getCandidateSignDetails({ candidateId: 'c1' }, 'tok');
      await reportSignCandidate({ candidateId: 'c1' }, { reason: 'BAD' } as never, 'tok');
      await reportCannotIdentifySign({ candidateId: 'c1' }, 'tok');
      await skipSign({ candidateId: 'c1' }, 'tok');
      await castVoteOnSignCandidate({ candidateId: 'c1' }, { vote: 'AGREE' } as never, 'tok');
      await undoVoteOnCandidate({ candidateId: 'c1' }, 'tok');
      await getMyReviewerStats('tok');
      await reportMissingType({ suggestedName: 'New Sign' } as never, 'tok');
      await getMyRecaptures(undefined, 'tok');
      await getMyRecaptures({ page: 3, pageSize: 50, status: 'OPEN' } as never, 'tok');
      await submitCandidateRecapture('c1', new FormData(), 'tok');

      expect(mockApiRequest).toHaveBeenCalled();
      expect(mockJsonApiRequest).toHaveBeenCalled();
    });
  });

  describe('WorkDailyTipCard, RevalidationVotedResultCard & NavigationTopControls', () => {
    it('renders WorkDailyTipCard with fixed initialIndex and dynamic random index', async () => {
      await render(<WorkDailyTipCard initialIndex={0} testID="tip-fixed" />);
      expect(screen.getByTestId('tip-fixed')).toBeTruthy();

      await screen.rerender(<WorkDailyTipCard testID="tip-random" />);
      expect(screen.getByTestId('tip-random')).toBeTruthy();
    });

    it('renders RevalidationVotedResultCard across all actions and banner', async () => {
      const onFix = jest.fn();
      const onKeep = jest.fn();
      const onCancel = jest.fn();

      const actions: Array<'STILL_ACTIVE' | 'REMOVED' | 'CHANGED' | 'UNCLEAR' | 'INVALID' | undefined> = [
        'STILL_ACTIVE',
        'REMOVED',
        'CHANGED',
        'UNCLEAR',
        'INVALID',
        undefined,
      ];

      await render(
        <RevalidationVotedResultCard
          onFixResult={onFix}
          onKeepResult={onKeep}
          review={{ action: 'STILL_ACTIVE', note: 'Custom note' } as never}
        />,
      );
      expect(screen.getByText(/Custom note/)).toBeTruthy();

      for (const action of actions) {
        await screen.rerender(
          <RevalidationVotedResultCard
            onFixResult={onFix}
            onKeepResult={onKeep}
            review={action ? ({ action } as never) : undefined}
          />,
        );
      }

      await fireEvent.press(screen.getByTestId('reval-fix-result-button'));
      await fireEvent.press(screen.getByTestId('reval-keep-result-button'));
      expect(onFix).toHaveBeenCalledTimes(1);
      expect(onKeep).toHaveBeenCalledTimes(1);

      await screen.rerender(<RevalidationEditingBanner onCancel={onCancel} />);
      await fireEvent.press(screen.getByTestId('reval-cancel-edit-button'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('renders NavigationTopControls across search, destination-only, and planned-route modes', async () => {
      const onSearch = jest.fn();
      const onTopUp = jest.fn();
      const onNotif = jest.fn();
      const onChangeDest = jest.fn();
      const onSwap = jest.fn();

      await render(
        <NavigationTopControls
          onChangeDestinationPress={onChangeDest}
          onSearchPress={onSearch}
          onTopUpPress={onTopUp}
          plannedRouteOrigin={undefined}
          selectedDestination={undefined}
          walletBalance={undefined}
        />,
      );

      await fireEvent.press(screen.getByLabelText(/Nạp điểm/));
      expect(onTopUp).toHaveBeenCalledTimes(1);
      await fireEvent.press(screen.getByLabelText(/Thông báo/));
      expect(mockPush).toHaveBeenCalledWith('/notifications');

      await screen.rerender(
        <NavigationTopControls
          onChangeDestinationPress={onChangeDest}
          onNotificationsPress={onNotif}
          onSearchPress={onSearch}
          onTopUpPress={onTopUp}
          plannedRouteOrigin={undefined}
          selectedDestination={{
            id: 'd1',
            title: 'Chợ Bến Thành',
            coordinate: [106.69, 10.77],
          }}
          walletBalance={50}
        />,
      );
      await screen.rerender(
        <NavigationTopControls
          onChangeDestinationPress={onChangeDest}
          onNotificationsPress={onNotif}
          onSearchPress={onSearch}
          onSwapRoutePress={onSwap}
          onTopUpPress={onTopUp}
          plannedRouteOrigin={[106.68, 10.76]}
          routeStartTitle={undefined}
          selectedDestination={{
            id: 'd2',
            title: 'Bến Xe',
            coordinate: [106.7, 10.8],
          }}
        />,
      );
      await screen.rerender(
        <NavigationTopControls
          onChangeDestinationPress={onChangeDest}
          onNotificationsPress={onNotif}
          onSearchPress={onSearch}
          onTopUpPress={onTopUp}
          plannedRouteOrigin={[106.68, 10.76]}
          routeStartTitle="Nhà riêng"
          selectedDestination={{
            id: 'd2',
            title: 'Bến Xe',
            coordinate: [106.7, 10.8],
          }}
        />,
      );
      expect(screen.getAllByText('Bến Xe').length).toBeGreaterThan(0);
    });
  });

  describe('ReturnedSubmissionsListScreen', () => {
    it('covers loading, empty, date-filtered empty, statuses, media types, and navigation', async () => {
      mockUseGetMySubmissions.mockReturnValue({
        data: undefined,
        isLoading: true,
        isRefetching: false,
        refetch: mockRefetch,
      });
      await render(<ReturnedSubmissionsListScreen />);
      expect(screen.getByText('Đang tải danh sách ảnh bị trả về...')).toBeTruthy();

      mockUseGetMySubmissions.mockReturnValue({
        data: { items: [] },
        isLoading: false,
        isRefetching: false,
        refetch: mockRefetch,
      });
      await screen.rerender(<ReturnedSubmissionsListScreen />);
      expect(screen.getByText('Hiện chưa có ảnh khảo sát nào bị trả về.')).toBeTruthy();

      const items = [
        {
          id: 's1',
          status: 'PENDING_CORRECTION',
          submissionType: 'SINGLE_IMAGE',
          createdAt: '2026-04-01T10:00:00Z',
          signCount: 2,
          locationAddress: 'Đường Lê Lợi',
        },
        {
          id: 's2',
          status: 'REJECTED',
          submissionType: 'VIDEO_GPX',
          createdAt: 'invalid-date',
          rejectionReason: 'Ảnh bị mờ',
        },
        {
          id: 's3',
          status: 'FAILED',
          submissionType: 'UNKNOWN_TYPE',
          updatedAt: '2026-04-02T12:00:00Z',
        },
        {
          id: 's4',
          status: 'NO_SIGN_DETECTED',
          createdAt: '',
        },
        {
          id: 's5',
          status: 'COMPLETED',
        },
      ];

      (globalThis as Record<string, unknown>).__forceEmptyFilteredList = true;
      mockUseGetMySubmissions.mockReturnValue({
        data: { items },
        isLoading: false,
        isRefetching: true,
        refetch: mockRefetch,
      });
      await screen.rerender(<ReturnedSubmissionsListScreen />);
      expect(screen.getByText('Không có bản ghi nào phù hợp với bộ lọc ngày đã chọn.')).toBeTruthy();

      (globalThis as Record<string, unknown>).__forceEmptyFilteredList = false;
      mockUseGetMySubmissions.mockReturnValue({
        data: { items },
        isLoading: false,
        isRefetching: false,
        refetch: mockRefetch,
      });
      await screen.rerender(<ReturnedSubmissionsListScreen />);
      expect(screen.getByText('4 hồ sơ cần cập nhật hoặc khoanh vùng lại')).toBeTruthy();
      expect(screen.getByText('Bị từ chối')).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Làm mới danh sách'));
      expect(mockRefetch).toHaveBeenCalled();

      await fireEvent.press(screen.getByLabelText('Quay lại công việc'));
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/work');

      const openButtons = screen.getAllByLabelText('Xem và khoanh vùng biển báo');
      await fireEvent.press(openButtons[0]);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/work/returned-submission-item',
        params: { id: 's1' },
      });
    });
  });
});
