import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import {
  ReturnedSubmissionsListScreen,
  MOCK_RETURNED_SUBMISSION,
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

  it('renders header, back button, guideline banner, and mock item in virtual list', async () => {
    mockSubmissionsData = { items: [] };

    const { getByText, getByLabelText } = await render(<ReturnedSubmissionsListScreen />);

    expect(getByText('Ảnh bị trả về')).toBeTruthy();
    expect(getByLabelText('Quay lại công việc')).toBeTruthy();
    expect(getByText('Lọc theo ngày')).toBeTruthy();

    // The mock item should be visible in the list
    expect(getByText('Khảo sát hình ảnh')).toBeTruthy();
    expect(getByText('Cần chỉnh sửa')).toBeTruthy();
    expect(
      getByText(
        'AI không phát hiện được biển báo trong ảnh. Vui lòng khoanh vùng vị trí biển báo nếu bạn chắc chắn ảnh có biển báo hợp lệ.'
      )
    ).toBeTruthy();

    // Test back button
    fireEvent.press(getByLabelText('Quay lại công việc'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/work',
      params: { currentRole: 'surveyor' },
    });
  });

  it('navigates to return item screen with ID when item is clicked', async () => {
    mockSubmissionsData = { items: [] };

    const { getByText } = await render(<ReturnedSubmissionsListScreen />);

    // Click on the action button or the mock item
    const actionBtn = getByText('Xem & Khoanh vùng');
    fireEvent.press(actionBtn);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/returned-submission-item',
      params: { id: MOCK_RETURNED_SUBMISSION.id },
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
