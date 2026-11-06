import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';

// ---------------------------------------------------------------------------
// 1. Navigation & Expo Router Mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSegments: string[] = ['(authenticated)', '(tabs)', 'work'];

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useSegments: () => mockSegments,
  useLocalSearchParams: () => ({}),
}));

// ---------------------------------------------------------------------------
// 2. UI & Theme Mocks
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: (props: any) =>
    React.createElement(View, { testID: `icon-${props.name}`, ...props }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    surface: '#FFFFFF',
    neutral: '#F1F5F9',
    grey: '#64748B',
  }),
}));

jest.mock('@/components/offline-map-modal', () => ({
  OfflineMapModal: ({ visible, onClose }: any) =>
    visible ? React.createElement(View, { testID: 'offline-map-modal' }) : null,
}));

// ---------------------------------------------------------------------------
// 3. GPS Utility Mock
// ---------------------------------------------------------------------------
const mockFetchFreshGpsPosition = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: (...args: any[]) => mockFetchFreshGpsPosition(...args),
}));

// ---------------------------------------------------------------------------
// 4. Session Provider Mock
// ---------------------------------------------------------------------------
let mockSessionUser: {
  id: string;
  roles: string[];
} = {
  id: 'test-user-1',
  roles: ['driver', 'surveyor', 'reviewer'],
};

jest.mock('@/context/session-provider', () => ({
  ACCOUNT_ROLES: ['driver', 'surveyor', 'reviewer'],
  useSession: () => ({
    session: {
      accessToken: 'mock-test-token',
      account: mockSessionUser,
    },
    currentRole: 'driver',
    switchRole: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// 5. Query Hooks Mocks
// ---------------------------------------------------------------------------
const mockUseGetNavigationSessions = jest.fn();
jest.mock('@/feature/navigation/hooks/use-navigation', () => ({
  useGetNavigationSessions: (...args: any[]) => mockUseGetNavigationSessions(...args),
}));

const mockUseGetMyReviewerStats = jest.fn();
const mockUseGetReviewQueue = jest.fn();
jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetMyReviewerStats: (...args: any[]) => mockUseGetMyReviewerStats(...args),
  useGetReviewQueue: (...args: any[]) => mockUseGetReviewQueue(...args),
}));

const mockUseGetMyPendingSubmissions = jest.fn();
const mockUseGetMySurveyStats = jest.fn();
jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetMyPendingSubmissions: (...args: any[]) => mockUseGetMyPendingSubmissions(...args),
  useGetMySurveyStats: (...args: any[]) => mockUseGetMySurveyStats(...args),
}));

const mockUseGetMyRecaptures = jest.fn();
jest.mock('@/feature/review/hooks/use-recapture', () => ({
  useGetMyRecaptures: (...args: any[]) => mockUseGetMyRecaptures(...args),
}));

const mockUseGetFirstRevalidationSign = jest.fn();
const mockUseGetRevalidationEvidenceQueue = jest.fn();
const mockFetchFirstRevalidationSign = jest.fn();
jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetFirstRevalidationSign: (...args: any[]) => mockUseGetFirstRevalidationSign(...args),
  useGetRevalidationEvidenceQueue: (...args: any[]) => mockUseGetRevalidationEvidenceQueue(...args),
}));
jest.mock('@/api/revalidation/revalidation', () => ({
  fetchFirstRevalidationSign: (...args: any[]) => mockFetchFirstRevalidationSign(...args),
}));

jest.mock('@/feature/work/hooks/use-daily-tasks', () => ({
  getFallbackMissionsForRole: () => [],
  isTaskForRole: () => true,
  useGetMyTaskCompletions: () => ({ data: [] }),
}));

// ---------------------------------------------------------------------------
// Components Under Test
// ---------------------------------------------------------------------------
import { DriverWork } from '@/feature/work/components/driver-work';
import { ReviewerWork } from '@/feature/work/components/reviewer-work';
import { SurveyorWork, SurveyorFab } from '@/feature/work/components/surveyor-work';
import { WorkScreen } from '@/feature/work/pages/work-screen';

describe('Work Roles & Component Architecture Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSegments = ['(authenticated)', '(tabs)', 'work'];
    mockSessionUser = {
      id: 'test-user-1',
      roles: ['driver', 'surveyor', 'reviewer'],
    };

    mockFetchFreshGpsPosition.mockResolvedValue([106.7009, 10.7769]);
    mockUseGetNavigationSessions.mockReturnValue({
      data: { total: 12, items: [] },
    });
    mockUseGetMyReviewerStats.mockReturnValue({
      data: {
        totalReviews: 45,
        reliabilityScore: 0.96,
        accuracyRate: 0.94,
      },
    });
    mockUseGetReviewQueue.mockReturnValue({
      data: { total: 7, submissions: [] },
    });
    mockUseGetRevalidationEvidenceQueue.mockReturnValue({
      data: { total: 3, items: [] },
    });
    mockUseGetMyPendingSubmissions.mockReturnValue({
      data: { pending: 5, countsByStatus: { DRAFT: 2 } },
    });
    mockUseGetMySurveyStats.mockReturnValue({
      data: { revalidationAvailable: 8 },
    });
    mockUseGetMyRecaptures.mockReturnValue({
      data: { total: 4, items: [] },
    });
    mockUseGetFirstRevalidationSign.mockReturnValue({
      data: {
        id: 'first-reval-1',
        coordinate: [106.7009, 10.7769],
        signCode: 'P.102',
        name: 'Cấm đi ngược chiều',
        imageUrl: 'https://example.com/p102.png',
      },
    });
  });

  // =========================================================================
  // SUITE 1: DriverWork Component
  // =========================================================================
  describe('1. DriverWork Component', () => {
    it('renders navigation history and sign catalog action cards with session total', () => {
      const { getByText } = render(<DriverWork />);

      expect(getByText('Lịch sử di chuyển')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
      expect(getByText('Tra cứu biển báo giao thông')).toBeTruthy();
    });

    it('navigates to /work/navigation-history when pressing history card', () => {
      const { getByText } = render(<DriverWork />);

      fireEvent.press(getByText('Lịch sử di chuyển'));
      expect(mockPush).toHaveBeenCalledWith('/work/navigation-history');
    });

    it('navigates to /work/sign-catalog with role driver when pressing catalog card', () => {
      const { getByText } = render(<DriverWork />);

      fireEvent.press(getByText('Tra cứu biển báo giao thông'));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/work/sign-catalog',
        params: { role: 'driver' },
      });
    });

    it('uses fallback prop driverSessionsTotal when provided', () => {
      const { getByText } = render(<DriverWork driverSessionsTotal={99} />);

      expect(getByText('99')).toBeTruthy();
    });

    it('guards queries with isDriver check', () => {
      mockSessionUser = { id: 'surveyor-only', roles: ['surveyor'] };
      render(<DriverWork />);

      expect(mockUseGetNavigationSessions).toHaveBeenCalledWith(
        { page: 1, pageSize: 1 },
        false, // enabled should be false
      );
    });
  });

  // =========================================================================
  // SUITE 2: ReviewerWork Component
  // =========================================================================
  describe('2. ReviewerWork Component', () => {
    it('renders hero review queue card with badge and reviewer stats', () => {
      const { getByText, getByLabelText } = render(<ReviewerWork />);

      expect(getByText('Thẩm định chờ xử lý')).toBeTruthy();
      expect(getByText('7 MỚI')).toBeTruthy();
      expect(getByText('Minh chứng tái thẩm định chờ duyệt')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(getByText('Thống kê của bạn')).toBeTruthy();
      expect(getByText('Độ tin cậy: 96% · Tỷ lệ chính xác: 94%')).toBeTruthy();

      const heroBtn = getByLabelText('Thẩm định các hồ sơ chờ xử lý');
      fireEvent.press(heroBtn);
      expect(mockPush).toHaveBeenCalledWith('/work/submission-review');
    });

    it('navigates to revalidation-review, reviewer-stats, and sign-catalog', () => {
      const { getByText } = render(<ReviewerWork />);

      fireEvent.press(getByText('Minh chứng tái thẩm định chờ duyệt'));
      expect(mockPush).toHaveBeenCalledWith('/work/revalidation-review');

      fireEvent.press(getByText('Thống kê của bạn'));
      expect(mockPush).toHaveBeenCalledWith('/work/reviewer-stats');

      fireEvent.press(getByText('Tra cứu biển báo giao thông'));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/work/sign-catalog',
        params: { role: 'reviewer' },
      });
    });

    it('guards reviewer queries with isReviewer check', () => {
      mockSessionUser = { id: 'driver-only', roles: ['driver'] };
      render(<ReviewerWork />);

      expect(mockUseGetMyReviewerStats).toHaveBeenCalledWith(false);
      expect(mockUseGetReviewQueue).toHaveBeenCalledWith({ page: '1', pageSize: '20' }, false);
      expect(mockUseGetRevalidationEvidenceQueue).toHaveBeenCalledWith(
        { page: 1, pageSize: 1 },
        false,
      );
    });
  });

  // =========================================================================
  // SUITE 3: SurveyorWork Component
  // =========================================================================
  describe('3. SurveyorWork Component', () => {
    it('renders surveyor action cards with pending and recaptures count', () => {
      const { getByText } = render(<SurveyorWork />);

      expect(getByText('Lịch sử khảo sát')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
      expect(getByText('Tái xác nhận biển báo')).toBeTruthy();
      expect(getByText('8')).toBeTruthy();
      expect(getByText('Yêu cầu chụp lại ảnh')).toBeTruthy();
      expect(getByText('4')).toBeTruthy();
      expect(getByText('Tra cứu biển báo giao thông')).toBeTruthy();
    });

    it('renders offline map card when onOpenOfflineMap callback is provided', () => {
      const mockOnOpenOfflineMap = jest.fn();
      const { getByText } = render(<SurveyorWork onOpenOfflineMap={mockOnOpenOfflineMap} />);

      const offlineCard = getByText('Bản đồ ngoại tuyến');
      expect(offlineCard).toBeTruthy();

      fireEvent.press(offlineCard);
      expect(mockOnOpenOfflineMap).toHaveBeenCalled();
    });

    it('acquires real user coordinates via fetchFreshGpsPosition and passes to useGetFirstRevalidationSign', async () => {
      mockFetchFreshGpsPosition.mockResolvedValue([106.6900, 10.7800]);

      render(<SurveyorWork />);

      await waitFor(() => {
        expect(mockFetchFreshGpsPosition).toHaveBeenCalled();
      });

      expect(mockUseGetFirstRevalidationSign).toHaveBeenCalledWith(
        expect.any(Array),
        true,
      );
    });

    it('navigates to revalidation-map with snap coordinates when revalidation card is pressed', async () => {
      const { getByText } = render(<SurveyorWork />);

      fireEvent.press(getByText('Tái xác nhận biển báo'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/work/revalidation-map',
        params: expect.objectContaining({
          autoSelectFirst: 'true',
          selectedSignId: 'first-reval-1',
          snapLon: '106.7009',
          snapLat: '10.7769',
        }),
      });
    });

    it('SurveyorFab renders floating plus button and navigates to /work/new-survey', () => {
      const { getByLabelText } = render(<SurveyorFab />);

      const fab = getByLabelText('Tạo bản ghi khảo sát mới');
      fireEvent.press(fab);
      expect(mockPush).toHaveBeenCalledWith('/work/new-survey');
    });

    it('guards surveyor queries with isSurveyor check', () => {
      mockSessionUser = { id: 'driver-only', roles: ['driver'] };
      render(<SurveyorWork />);

      expect(mockUseGetMyPendingSubmissions).toHaveBeenCalledWith(false);
      expect(mockUseGetMySurveyStats).toHaveBeenCalledWith(false);
      expect(mockUseGetMyRecaptures).toHaveBeenCalledWith({ page: 1, pageSize: 20 }, false);
      expect(mockUseGetFirstRevalidationSign).toHaveBeenCalledWith(undefined, false);
    });
  });

  // =========================================================================
  // SUITE 4: WorkScreen Integration & Role Switcher
  // =========================================================================
  describe('4. WorkScreen Integration & Role Switching', () => {
    it('mounts DriverWork by default when driver is the initial role', () => {
      const { getByText, queryByText } = render(<WorkScreen currentRole="driver" />);

      expect(getByText('Vai trò: Tài xế')).toBeTruthy();
      expect(getByText('Lịch sử di chuyển')).toBeTruthy();
      expect(queryByText('Thẩm định chờ xử lý')).toBeNull();
      expect(queryByText('Tái xác nhận biển báo')).toBeNull();
    });

    it('switches to SurveyorWork and renders SurveyorFab when surveyor tab is selected', () => {
      const { getByText, getByLabelText } = render(<WorkScreen currentRole="driver" />);

      fireEvent.press(getByText('Khảo sát'));

      expect(getByText('Vai trò: Khảo sát')).toBeTruthy();
      expect(getByText('Lịch sử khảo sát')).toBeTruthy();
      expect(getByLabelText('Tạo bản ghi khảo sát mới')).toBeTruthy();
    });

    it('switches to ReviewerWork when reviewer tab is selected', () => {
      const { getByText } = render(<WorkScreen currentRole="driver" />);

      fireEvent.press(getByText('Thẩm định'));

      expect(getByText('Vai trò: Thẩm định')).toBeTruthy();
      expect(getByText('Thẩm định chờ xử lý')).toBeTruthy();
      expect(getByText('7 MỚI')).toBeTruthy();
    });

    it('handles single-role user without crashing (slider 2-point outputRange)', () => {
      mockSessionUser = { id: 'single-role-user', roles: ['driver'] };

      const { getByText } = render(<WorkScreen currentRole="driver" />);
      expect(getByText('Vai trò: Tài xế')).toBeTruthy();
    });

    it('opens offline map modal when pressing offline map header button', () => {
      const { getByLabelText, getByTestId } = render(<WorkScreen currentRole="driver" />);

      const offlineBtn = getByLabelText('Bản đồ ngoại tuyến');
      fireEvent.press(offlineBtn);

      expect(getByTestId('offline-map-modal')).toBeTruthy();
    });
  });
});
