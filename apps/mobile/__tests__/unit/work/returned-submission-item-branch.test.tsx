import React from 'react';
import { Alert, PanResponder } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();
let mockSearchParams: any = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-image', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => ReactActual.createElement(View, { testID: 'returned-img', ...props }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => ReactActual.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 16, left: 0, right: 0 }),
  };
});

jest.mock('@shopify/flash-list', () => {
  const ReactActual = require('react');
  const { FlatList } = require('react-native');
  return {
    FlashList: ReactActual.forwardRef((props: any, ref: any) =>
      ReactActual.createElement(FlatList, { ...props, ref }),
    ),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    grey: '#64748B',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#CBD5E1',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
  }),
}));

const mockLoadCatalog = jest.fn();
const mockGetCatalog = jest.fn();
jest.mock('@/api/reviews/catalog-storage', () => ({
  loadCatalogFromStorage: (...args: any[]) => mockLoadCatalog(...args),
}));
jest.mock('@/api/reviews/catalog', () => ({
  getCatalog: (...args: any[]) => mockGetCatalog(...args),
}));
jest.mock('@/context/session-provider', () => ({
  useOptionalSession: () => ({ session: { accessToken: 'tok-branch', account: { id: 'u1' } } }),
}));

jest.mock('@/api/reviews/review-workflow', () => ({
  resolveS3Url: (k?: string) => (k ? `https://s3.mock/${k}` : ''),
}));

let mockStatusQuery: any = { data: undefined, isLoading: false };
const mockResubmit = jest.fn();
jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetSurveySubmissionStatus: () => mockStatusQuery,
  useResubmitFalseNegativeMutation: () => ({ mutateAsync: mockResubmit, isPending: false }),
}));

import {
  MAX_BOXES,
  ReturnedSubmissionItemScreen,
  getBoxColor,
  getSignBadgeColors,
  getSignColorFromCode,
} from '@/feature/work/pages/returned-submission-item-screen';

describe('ReturnedSubmissionItemScreen Branch Coverage', () => {
  const panConfigs: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    panConfigs.length = 0;
    mockSearchParams = {};
    mockStatusQuery = { data: undefined, isLoading: false };
    mockLoadCatalog.mockResolvedValue(null);
    mockGetCatalog.mockResolvedValue({ categories: [], signs: [] });
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest.spyOn(PanResponder, 'create').mockImplementation((cfg: any) => {
      panConfigs.push(cfg);
      return { panHandlers: {} } as any;
    });
  });

  it('covers color helpers across P, W, R, I, T, and default sign/category codes', () => {
    for (const prefix of ['P.101', 'W.201', 'R.301', 'I.401', 'T.501', 'X.999', undefined]) {
      expect(getSignColorFromCode(prefix)).toBeTruthy();
      expect(getSignBadgeColors(prefix)).toBeTruthy();
    }
    expect(getBoxColor({ id: '1', x: 0, y: 0, width: 50, height: 50, category: 'WARNING' }, '#000')).toBe('#F59E0B');
    expect(getBoxColor({ id: '2', x: 0, y: 0, width: 50, height: 50, category: 'P.custom' }, '#000')).toBe('#EF4444');
    expect(getBoxColor({ id: '3', x: 0, y: 0, width: 50, height: 50 }, '#123456')).toBe('#123456');
  });

  it('covers status mediaFiles/sessions URL resolution, catalog storage load, box manipulation, catalog sheet, zoom, and resubmit alert flow', async () => {
    mockLoadCatalog.mockResolvedValueOnce({
      data: {
        signs: [
          { signCode: 'P.102', nameVi: 'Cấm đi ngược chiều', category: { nameVi: 'Cấm' }, representativeImageKey: 'https://cdn/p102.png' },
          { signCode: 'W.201', nameEn: 'Curve', category: { nameEn: 'Warning' }, representativeImageKey: 'https://signtrustmap.vn/ignored.png' },
          { signCode: 'R.301', nameVi: 'Hướng phải đi' },
          { signCode: 'I.401', nameVi: 'Ưu tiên' },
          { signCode: 'T.501', nameVi: 'Công trường' },
        ],
      },
    });
    mockStatusQuery = {
      isLoading: false,
      data: {
        sessions: [{ mediaType: 'IMAGE', storageKey: 'sessions/img.jpg' }],
      },
    };

    const screen = await render(<ReturnedSubmissionItemScreen id="sub-99" />);
    await waitFor(() => expect(screen.getByText('Hồ sơ: sub-99')).toBeTruthy());

    // Layout image + tap image to add box + PanResponder move/resize
    await fireEvent(screen.getByTestId('image-touch-area'), 'press', {
      nativeEvent: { locationX: 100, locationY: 100 },
    });
    expect(screen.getByText(`1/${MAX_BOXES} box`)).toBeTruthy();

    await act(async () => {
      for (const cfg of panConfigs) {
        cfg.onStartShouldSetPanResponder?.();
        cfg.onMoveShouldSetPanResponder?.({}, { dx: 10, dy: 10 });
        cfg.onPanResponderGrant?.({ stopPropagation: jest.fn() });
        cfg.onPanResponderMove?.({}, { dx: 20, dy: 15 });
        cfg.onPanResponderRelease?.();
      }
    });

    // Open catalog sheet, search, filter P/W/R/I/T/ALL, select P.102 sign
    await fireEvent.press(screen.getByTestId('box-catalog-trigger-0'));
    await fireEvent.changeText(screen.getByTestId('catalog-search-input'), 'cam');
    await fireEvent.press(screen.getByTestId('catalog-filter-p'));
    await fireEvent.press(screen.getByTestId('catalog-filter-all'));
    await fireEvent.press(screen.getByTestId('clear-catalog-search-btn'));
    await fireEvent.press(screen.getByTestId('catalog-sign-item-P.102'));
    expect(screen.getByText('P.102')).toBeTruthy();

    // Open zoom modal & close
    await fireEvent.press(screen.getByTestId('zoom-button'));
    await fireEvent.press(screen.getByTestId('close-zoom-btn'));

    // Add 6 more boxes to reach MAX_BOXES limit, then undo
    for (let i = 0; i < MAX_BOXES; i++) {
      await fireEvent.press(screen.getByTestId('add-box-btn'));
    }

    // Confirm alert -> trigger Đồng ý -> success & OK router.back()
    mockResubmit.mockResolvedValueOnce({ ok: true });
    await fireEvent.press(screen.getByTestId('confirm-btn'));
    const confirmButtons = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2];
    await act(async () => {
      await confirmButtons?.[1]?.onPress?.();
    });
    const successButtons = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2];
    successButtons?.[0]?.onPress?.();
    expect(mockBack).toHaveBeenCalled();

    // Confirm error path
    mockResubmit.mockRejectedValueOnce(new Error('Resubmit boom'));
    await fireEvent.press(screen.getByTestId('confirm-btn'));
    const errButtons = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2];
    await act(async () => {
      await errButtons?.[1]?.onPress?.();
    });

    await fireEvent.press(screen.getByTestId('undo-btn'));
    await fireEvent.press(screen.getByLabelText('Quay lại danh sách'));
  });
});
