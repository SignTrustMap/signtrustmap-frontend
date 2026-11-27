import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="sheet-expo-image" {...props} />,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    border: '#CBD5E1',
    primary: '#0671EB',
  }),
}));

jest.mock('@/api/revalidation/revalidation', () => ({
  checkInRevalidationTask: jest.fn(),
  finalizeRevalidationTask: jest.fn(),
  getAllRevalidationTasks: jest.fn(),
  getCheckInEligibility: jest.fn(),
  getEvidenceDecisions: jest.fn(),
  getRevalidationEvidenceQueue: jest.fn(),
  getRevalidationTask: jest.fn(),
  getRevalidationTasks: jest.fn(),
  getRevalidationTasksInBounds: jest.fn(),
  getSignEvidences: jest.fn(),
  getSignHistory: jest.fn(),
  getTaskEvidences: jest.fn(),
  requestEvidenceRecapture: jest.fn(),
  submitRevalidationEvidence: jest.fn(),
  voteOnRevalidationEvidence: jest.fn(),
}));

import * as revalApi from '@/api/revalidation/revalidation';

import {
  RevalReviewedSignRow,
  RevalSummaryMetric,
  RevalidationBottomSheet,
  RevalidationReviewSkeleton,
} from '@/feature/revalidation/components/revalidation-review-sheets';
import {
  useRequestEvidenceRecapture,
  useVoteOnRevalidationEvidence,
  useFinalizeRevalidationTask,
  useGetAllRevalidationTasks,
  useGetCheckInEligibility,
} from '@/feature/revalidation/hooks/use-revalidation';

describe('Revalidation Hooks & Sheets Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RevalidationReviewSheets', () => {
    it('renders RevalSummaryMetric, RevalReviewedSignRow (with/without image & distance), and skeleton', async () => {
      const recordWithImg: any = {
        action: 'STILL_ACTIVE',
        note: 'Rõ ràng',
        item: {
          evidence: { mediaUrl: 'ev/a.jpg', distanceMeters: 15 },
          verifiedSign: { signCode: 'P.102', nameVi: 'Cấm đi ngược chiều' },
        },
      };
      const recordNoImg: any = {
        action: 'REMOVED',
        item: {
          evidence: {},
          verifiedSign: { signCode: 'W.201', nameEn: 'Curve Left' },
        },
      };

      const screen = await render(
        <>
          <RevalSummaryMetric action="STILL_ACTIVE" count={3} />
          <RevalReviewedSignRow record={recordWithImg} />
          <RevalReviewedSignRow record={recordNoImg} />
          <RevalidationReviewSkeleton />
        </>,
      );

      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText(/Khoảng cách so với vị trí gốc: 15m/)).toBeTruthy();
      expect(screen.getByText(/Ghi chú: Rõ ràng/)).toBeTruthy();
      expect(screen.getByText(/Đã xác minh vị trí/)).toBeTruthy();
    });

    it('supports decline (with CHANGED + catalog sign picker), report, and recapture sheets', async () => {
      const onConfirmDecline = jest.fn();
      const onConfirmReport = jest.fn();
      const onConfirmRecapture = jest.fn();
      const onOpenCatalog = jest.fn();
      const onClearCatalogSign = jest.fn();
      const onClose = jest.fn();

      const screen = await render(
        <RevalidationBottomSheet
          onClearCatalogSign={onClearCatalogSign}
          onClose={onClose}
          onConfirmDecline={onConfirmDecline}
          onConfirmRecapture={onConfirmRecapture}
          onConfirmReport={onConfirmReport}
          onOpenCatalog={onOpenCatalog}
          selectedCatalogSign={{ id: 55, signCode: 'P.130', nameVi: 'Cấm dừng đỗ' } as any}
          surveyorVerdict="STILL_ACTIVE"
          type="decline"
        />,
      );

      await fireEvent.press(screen.getByText('Biển báo đã thay đổi'));
      expect(screen.getByText('P.130 - Cấm dừng đỗ')).toBeTruthy();
      await fireEvent.press(screen.getByText('Xác nhận từ chối'));
      expect(onConfirmDecline).toHaveBeenCalledWith('CHANGED', undefined, 55);

      await screen.rerender(
        <RevalidationBottomSheet
          onClose={onClose}
          onConfirmDecline={onConfirmDecline}
          onConfirmRecapture={onConfirmRecapture}
          onConfirmReport={onConfirmReport}
          type="report"
        />,
      );
      await fireEvent.press(screen.getByText('Gửi báo cáo'));
      expect(onConfirmReport).toHaveBeenCalled();

      await screen.rerender(
        <RevalidationBottomSheet
          onClose={onClose}
          onConfirmDecline={onConfirmDecline}
          onConfirmRecapture={onConfirmRecapture}
          onConfirmReport={onConfirmReport}
          type="recapture"
        />,
      );
      await fireEvent.press(screen.getByText('Gửi yêu cầu chụp lại'));
      expect(onConfirmRecapture).toHaveBeenCalled();
    });
  });

  describe('use-revalidation mutations and parameter overloads', () => {
    const makeWrapper = () => {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      );
    };

    it('covers vote consensus invalidation, requestEvidenceRecapture, finalize, and query overloads', async () => {
      (revalApi.voteOnRevalidationEvidence as jest.Mock).mockResolvedValueOnce({
        consensus: { evaluated: true, taskId: 't-10' },
      });
      (revalApi.requestEvidenceRecapture as jest.Mock).mockResolvedValueOnce({ success: true, taskId: 't-10' });
      (revalApi.finalizeRevalidationTask as jest.Mock).mockResolvedValueOnce({ evaluated: true });
      (revalApi.getAllRevalidationTasks as jest.Mock).mockResolvedValueOnce([]);
      (revalApi.getCheckInEligibility as jest.Mock).mockResolvedValueOnce({ eligible: true });

      const wrapper = makeWrapper();
      const { result } = await renderHook(
        () => ({
          vote: useVoteOnRevalidationEvidence(),
          recapture: useRequestEvidenceRecapture(),
          finalize: useFinalizeRevalidationTask(),
          allDisabled: useGetAllRevalidationTasks(false),
          allFiltered: useGetAllRevalidationTasks({ status: 'OPEN' }, true),
          eligibilityInvalid: useGetCheckInEligibility('t-10', Number.NaN, 106),
        }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.allFiltered.isFetched).toBe(true));

      await act(async () => {
        await result.current.vote.mutateAsync({ evidenceId: 'ev-1', dto: { decision: 'STILL_ACTIVE' } });
        await result.current.recapture.mutateAsync({ evidenceId: 'ev-1', dto: { reason: 'BLURRY' } });
        await result.current.finalize.mutateAsync('t-10');
      });

      expect(revalApi.voteOnRevalidationEvidence).toHaveBeenCalled();
      expect(revalApi.requestEvidenceRecapture).toHaveBeenCalled();
      expect(revalApi.finalizeRevalidationTask).toHaveBeenCalled();
    });
  });
});
