import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SubmissionCompleteScreen } from '@/feature/work/pages/submission-complete-screen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (cb: () => void) => cb(),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    border: '#E2E8F0',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    secondary: '#38BDF8',
    danger: '#EF4444',
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      R.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

describe('SubmissionCompleteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
  });

  it('renders upload_submission completion state and navigates to home when primary button is clicked', async () => {
    mockSearchParams = {
      type: 'upload_submission',
      submissionId: 'sub-12345678-abcd',
      submissionStatus: 'QUEUED',
    };

    const { getByText } = await render(<SubmissionCompleteScreen />);

    expect(getByText('Đã nộp hồ sơ khảo sát')).toBeTruthy();
    expect(getByText(/sub-1234/)).toBeTruthy();
    expect(getByText(/QUEUED/)).toBeTruthy();

    // Primary button navigates to home
    const homeBtn = getByText('Về trang chủ');
    expect(homeBtn).toBeTruthy();
    await fireEvent.press(homeBtn);
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  it('renders upload_revalidation completion state and has working secondary action', async () => {
    mockSearchParams = {
      type: 'upload_revalidation',
      taskId: 'task-abcdef12',
      signCode: 'P.102',
    };

    const { getByText } = await render(<SubmissionCompleteScreen />);

    expect(getByText('Đã gửi minh chứng tái thẩm định')).toBeTruthy();
    expect(getByText(/P.102/)).toBeTruthy();
    expect(getByText(/task-abc/)).toBeTruthy();

    const surveyAgainBtn = getByText('Khảo sát thực địa tiếp');
    await fireEvent.press(surveyAgainBtn);
    expect(mockReplace).toHaveBeenCalledWith('/work/revalidation-map');
  });

  it('renders review_submission completion state with reviewed item count', async () => {
    mockSearchParams = {
      type: 'review_submission',
      count: '8',
    };

    const { getByText } = await render(<SubmissionCompleteScreen />);

    expect(getByText('Hoàn tất thẩm định hồ sơ')).toBeTruthy();
    expect(getByText('Đã gửi kết quả thẩm định cho 8 biển báo thành công.')).toBeTruthy();
    expect(getByText('8 mục')).toBeTruthy();

    const reviewMoreBtn = getByText('Thẩm định thêm biển báo');
    await fireEvent.press(reviewMoreBtn);
    expect(mockReplace).toHaveBeenCalledWith('/work/submission-review');
  });

  it('renders review_revalidation completion state with reviewed item count', async () => {
    mockSearchParams = {
      type: 'review_revalidation',
      count: '5',
    };

    const { getByText } = await render(<SubmissionCompleteScreen />);

    expect(getByText('Hoàn tất đánh giá minh chứng')).toBeTruthy();
    expect(getByText('Đã đánh giá thành công 5 minh chứng tái thẩm định thực địa.')).toBeTruthy();
    expect(getByText('5 mục')).toBeTruthy();

    const revalMoreBtn = getByText('Đánh giá thêm minh chứng');
    await fireEvent.press(revalMoreBtn);
    expect(mockReplace).toHaveBeenCalledWith('/work/revalidation-review');
  });

  it('supports direct props overriding params', async () => {
    const { getByText } = await render(
      <SubmissionCompleteScreen
        count={12}
        description="Khảo sát đã hoàn thành mỹ mãn"
        title="Tùy chỉnh thành công"
        type="upload_submission"
      />,
    );

    expect(getByText('Tùy chỉnh thành công')).toBeTruthy();
    expect(getByText('Khảo sát đã hoàn thành mỹ mãn')).toBeTruthy();
    expect(getByText('12 mục')).toBeTruthy();
  });
});
