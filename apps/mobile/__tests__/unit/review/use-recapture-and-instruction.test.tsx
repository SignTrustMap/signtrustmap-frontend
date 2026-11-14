import React from 'react';
import { render, fireEvent, renderHook, waitFor, act, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

let mockSessionValue: any = {
  session: {
    accessToken: 'test-token',
    account: { id: 'reviewer-1' },
  },
};

jest.mock('@/context/session-provider', () => ({
  useSession: () => mockSessionValue,
}));

jest.mock('@/api/reviews/review', () => ({
  getMyRecaptures: jest.fn().mockResolvedValue({
    items: [{ id: 'rc-1', candidateId: 'c-1', status: 'PENDING' }],
    total: 1,
  }),
  submitCandidateRecapture: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    border: '#E2E8F0',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
  }),
}));

import {
  recaptureKeys,
  useGetMyRecaptures,
  useSubmitRecaptureMutation,
} from '@/feature/review/hooks/use-recapture';
import { ReviewInstructionModal } from '@/feature/review/components/review-instruction-modal';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('Review Feature: useRecapture & ReviewInstructionModal', () => {
  afterEach(async () => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('recaptureKeys & use-recapture.ts', () => {
    it('generates consistent query keys', () => {
      expect(recaptureKeys.all('acc-1')).toEqual(['recaptures', 'acc-1']);
      expect(recaptureKeys.list('acc-1', 2, 10)).toEqual(['recaptures', 'acc-1', 'list', 2, 10]);
    });

    it('queries recaptures list using useGetMyRecaptures', async () => {
      const wrapper = createWrapper();
      const { result } = await renderHook(() => useGetMyRecaptures({ page: 1, pageSize: 20 }), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.items).toHaveLength(1);
    });

    it('submits recapture with useSubmitRecaptureMutation', async () => {
      const wrapper = createWrapper();
      const { result } = await renderHook(() => useSubmitRecaptureMutation(), { wrapper });

      const mockFormData = new FormData();
      await act(async () => {
        await result.current.mutateAsync({
          candidateId: 'c-1',
          formData: mockFormData,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('throws error when user is unauthenticated', async () => {
      mockSessionValue = { session: null };
      const wrapper = createWrapper();
      const { result } = await renderHook(() => useSubmitRecaptureMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({
          candidateId: 'c-1',
          formData: new FormData(),
        })
      ).rejects.toThrow('Vui lòng đăng nhập để nộp ảnh chụp lại.');

      mockSessionValue = {
        session: {
          accessToken: 'test-token',
          account: { id: 'reviewer-1' },
        },
      };
    });
  });

  describe('ReviewInstructionModal component', () => {
    it('renders instruction modal with swipe guide directions and allows dismissing', async () => {
      const mockSetVisible = jest.fn();
      const { getByText, getByLabelText } = await render(
        <ReviewInstructionModal
          isHelpModalVisible={true}
          setIsHelpModalVisible={mockSetVisible}
        />
      );

      expect(getByText('Hướng dẫn quẹt thẻ')).toBeTruthy();
      expect(getByText('Quẹt sang PHẢI: Đồng ý')).toBeTruthy();
      expect(getByText('Quẹt sang TRÁI: Từ chối')).toBeTruthy();
      expect(getByText('Quẹt LÊN TRÊN: Bỏ qua')).toBeTruthy();
      expect(getByText('Quẹt XUỐNG DƯỚI: Báo cáo')).toBeTruthy();

      const understandBtn = getByText('Đã hiểu');
      fireEvent.press(understandBtn);
      expect(mockSetVisible).toHaveBeenCalledWith(false);

      const closeBtn = getByLabelText('Đóng');
      fireEvent.press(closeBtn);
      expect(mockSetVisible).toHaveBeenCalledWith(false);
    });
  });
});
