import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import {
  ReturnedSubmissionsListScreen,
} from '@/feature/work/pages/returned-submissions-list-screen';
import type { SurveySubmission } from '@/types/surveySubmissionType';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

let mockSubmissionsData: { items: SurveySubmission[] } | undefined = undefined;
let mockIsLoading = false;
let mockIsRefetching = false;
const mockRefetch = jest.fn();

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetMySubmissions: () => ({
    data: mockSubmissionsData,
    isLoading: mockIsLoading,
    isRefetching: mockIsRefetching,
    refetch: mockRefetch,
  }),
}));

describe('ReturnedSubmissionsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmissionsData = undefined;
    mockIsLoading = false;
    mockIsRefetching = false;
  });

  it('renders header, back button, guideline banner, and empty state when backend returns no items', async () => {
    mockSubmissionsData = { items: [] };

    const { getByText, getByLabelText, queryByText } = await render(<ReturnedSubmissionsListScreen />);

    expect(getByText('Ảnh bị trả về')).toBeTruthy();
    expect(getByLabelText('Quay lại công việc')).toBeTruthy();
    expect(getByText('Lọc theo ngày')).toBeTruthy();
    expect(getByText('0 hồ sơ cần cập nhật hoặc khoanh vùng lại')).toBeTruthy();
    expect(getByText('Không tìm thấy ảnh bị trả về')).toBeTruthy();
    expect(getByText('Hiện chưa có ảnh khảo sát nào bị trả về.')).toBeTruthy();
    expect(queryByText('Xem & Khoanh vùng')).toBeNull();

    // Test back button
    fireEvent.press(getByLabelText('Quay lại công việc'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/work',
      params: { currentRole: 'surveyor' },
    });
  });

  it('renders loading state when isLoading is true', async () => {
    mockIsLoading = true;

    const { getByText } = await render(<ReturnedSubmissionsListScreen />);
    expect(getByText('Đang tải danh sách ảnh bị trả về...')).toBeTruthy();
  });

  it('triggers refetch when pressing reload button', async () => {
    mockSubmissionsData = { items: [] };

    const { getByLabelText } = await render(<ReturnedSubmissionsListScreen />);
    fireEvent.press(getByLabelText('Làm mới danh sách'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders real backend submissions when available and navigates with real ID', async () => {
    const realItem: SurveySubmission = {
      id: 'sub-real-fn-001',
      surveyorId: 'surveyor-123',
      submissionType: 'SINGLE_IMAGE',
      status: 'NO_SIGN_DETECTED',
      failureReason: 'Không phát hiện biển báo nào trong ảnh chụp',
      totalCandidatesExtracted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockSubmissionsData = { items: [realItem] };

    const { getByText } = await render(<ReturnedSubmissionsListScreen />);

    expect(getByText('Không có biển báo')).toBeTruthy();
    expect(getByText('Không phát hiện biển báo nào trong ảnh chụp')).toBeTruthy();

    const actionBtn = getByText('Xem & Khoanh vùng');
    fireEvent.press(actionBtn);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/returned-submission-item',
      params: { id: 'sub-real-fn-001' },
    });
  });
});
