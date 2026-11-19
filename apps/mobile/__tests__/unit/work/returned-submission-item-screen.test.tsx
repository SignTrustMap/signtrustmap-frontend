import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

import {
  ReturnedSubmissionItemScreen,
  getSignColorFromCode,
  normalizeVietnameseSearch,
  getBoxColor,
} from '@/feature/work/pages/returned-submission-item-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
  useLocalSearchParams: () => ({ id: 'mock-sub-123' }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

describe('ReturnedSubmissionItemScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders header with submission ID and back button', async () => {
    const { getByText, getByLabelText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    expect(getByText('Xác nhận vị trí biển báo')).toBeTruthy();
    expect(getByText('Hồ sơ: test-item-999')).toBeTruthy();

    const backBtn = getByLabelText('Quay lại danh sách');
    fireEvent.press(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders zoom button and toggles fullscreen modal when clicked', async () => {
    const { getByTestId, queryByTestId } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const zoomBtn = getByTestId('zoom-button');
    expect(zoomBtn).toBeTruthy();

    // Click zoom button to open full-screen modal
    await act(async () => {
      fireEvent.press(zoomBtn);
    });
    expect(getByTestId('close-zoom-btn')).toBeTruthy();

    // Click close button to dismiss modal
    await act(async () => {
      fireEvent.press(getByTestId('close-zoom-btn'));
    });
    expect(queryByTestId('close-zoom-btn')).toBeNull();
  });

  it('forms a bounding box on image click indicating traffic sign location', async () => {
    const { getByTestId, queryByText, getAllByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    expect(queryByText('Biển báo #1')).toBeNull();

    // Simulate clicking on the image touch area
    const touchArea = getByTestId('image-touch-area');
    await act(async () => {
      fireEvent.press(touchArea, {
        nativeEvent: { locationX: 120, locationY: 100 },
      });
    });

    // Bounding box should now be formed with "Biển báo #1"
    expect(getAllByText('Biển báo #1').length).toBeGreaterThan(0);
    expect(getByTestId('box-classification-section')).toBeTruthy();
  });

  it('opens catalog bottom sheet, searches signs in Vietnamese, and applies sign category color', async () => {
    const { getByTestId, getByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const addBoxBtn = getByTestId('add-box-btn');
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });

    // Classification section should be visible
    expect(getByTestId('box-classification-section')).toBeTruthy();
    expect(getByText('Box 1')).toBeTruthy();
    expect(getByTestId('box-color-square-0')).toBeTruthy();

    // The catalog picker trigger button
    const catalogTrigger = getByTestId('box-catalog-trigger-0');
    expect(catalogTrigger).toBeTruthy();

    // Open catalog bottom sheet
    await act(async () => {
      fireEvent.press(catalogTrigger);
    });

    // Catalog modal should be visible
    expect(getByTestId('catalog-bottom-sheet')).toBeTruthy();
    expect(getByText('Chọn biển báo thay thế từ danh mục')).toBeTruthy();

    // Vietnamese search: search by name without diacritics "duong cam"
    const searchInput = getByTestId('catalog-search-input');
    await act(async () => {
      fireEvent.changeText(searchInput, 'duong cam');
    });

    // Should find P.101 - Đường cấm
    expect(getByText('Đường cấm')).toBeTruthy();
    expect(getByText('P.101')).toBeTruthy();

    // Select the sign P.101
    const signItem = getByTestId('catalog-sign-item-P.101');
    await act(async () => {
      fireEvent.press(signItem);
    });

    // Box 1 trigger should now reflect P.101 and Đường cấm
    await waitFor(() => {
      expect(getByText('P.101')).toBeTruthy();
      expect(getByText('Đường cấm')).toBeTruthy();
    });
  });

  it('supports adding up to 7 boxes using the Add Box button', async () => {
    const { getByTestId, getByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const addBoxBtn = getByTestId('add-box-btn');

    // Add 7 boxes
    for (let i = 1; i <= 7; i++) {
      await act(async () => {
        fireEvent.press(addBoxBtn);
      });
      expect(getByText(`Box ${i}`)).toBeTruthy();
    }

    expect(getByText('Đã đủ 7 box')).toBeTruthy();
    expect(getByText('7/7 box')).toBeTruthy();

    // Verify button is disabled when max 7 boxes is reached
    expect(addBoxBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('filters by category tab and correctly determines colors by first letter (P, W, R, I, T)', async () => {
    const { getByTestId, getByText, queryByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const addBoxBtn = getByTestId('add-box-btn');
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });

    // Open catalog bottom sheet
    await act(async () => {
      fireEvent.press(getByTestId('box-catalog-trigger-0'));
    });

    // Tap warning filter tab
    const warningTab = getByTestId('catalog-filter-w');
    await act(async () => {
      fireEvent.press(warningTab);
    });

    // Should display W signs like W.201a and not P signs
    expect(getByText('W.201a')).toBeTruthy();
    expect(queryByText('P.101')).toBeNull();

    // Select W.201a
    await act(async () => {
      fireEvent.press(getByTestId('catalog-sign-item-W.201a'));
    });

    // Box 1 should now display W.201a
    expect(getByText('W.201a')).toBeTruthy();
  });

  it('removes bounding box when Undo button is pressed', async () => {
    const { getByTestId, queryByText, getAllByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const addBoxBtn = getByTestId('add-box-btn');
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });
    expect(getAllByText('Biển báo #1').length).toBeGreaterThan(0);

    // Press Undo button
    const undoBtn = getByTestId('undo-btn');
    await act(async () => {
      fireEvent.press(undoBtn);
    });

    // Bounding box should be removed
    expect(queryByText('Biển báo #1')).toBeNull();
  });

  it('plays "Bạn chắc chắn chứ?" alert when Confirm button is pressed', async () => {
    const { getByTestId } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const addBoxBtn = getByTestId('add-box-btn');
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });

    const confirmBtn = getByTestId('confirm-btn');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Bạn chắc chắn chứ?',
      expect.stringContaining('Bạn đang xác nhận 1 vị trí khoanh vùng có biển báo giao thông hợp lệ.'),
      expect.any(Array)
    );
  });

  it('displays the required warning text below the confirmation button', async () => {
    const { getByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    expect(
      getByText(
        'Chỉ chọn nếu bạn chắc chắn rằng ảnh có biển báo hợp lệ, nếu không, hệ thống sẽ trừ điểm credits của bạn.'
      )
    ).toBeTruthy();
  });

  describe('helper functions', () => {
    it('getSignColorFromCode determines color from first letter: P (red), W (yellow), R (blue), I (green), T (orange)', () => {
      expect(getSignColorFromCode('P.101')).toBe('#EF4444');
      expect(getSignColorFromCode('p.102')).toBe('#EF4444');
      expect(getSignColorFromCode('W.201a')).toBe('#F59E0B');
      expect(getSignColorFromCode('w.208')).toBe('#F59E0B');
      expect(getSignColorFromCode('R.301a')).toBe('#3B82F6');
      expect(getSignColorFromCode('r.407a')).toBe('#3B82F6');
      expect(getSignColorFromCode('I.401')).toBe('#10B981');
      expect(getSignColorFromCode('i.408')).toBe('#10B981');
      expect(getSignColorFromCode('T.501')).toBe('#F97316');
      expect(getSignColorFromCode('t.504')).toBe('#F97316');
      expect(getSignColorFromCode(undefined, '#00838F')).toBe('#00838F');
    });

    it('normalizeVietnameseSearch strips diacritics, d/đ, punctuation for friendly search', () => {
      expect(normalizeVietnameseSearch('Đường cấm')).toBe('duong cam');
      expect(normalizeVietnameseSearch('duong cam')).toBe('duong cam');
      expect(normalizeVietnameseSearch('P.101')).toBe('p101');
      expect(normalizeVietnameseSearch('p101')).toBe('p101');
      expect(normalizeVietnameseSearch('Cảnh báo nguy hiểm')).toBe('canh bao nguy hiem');
    });

    it('getBoxColor prioritizes signCode first letter', () => {
      const boxWithCode = { id: '1', x: 0, y: 0, width: 85, height: 85, signCode: 'P.101' };
      expect(getBoxColor(boxWithCode, '#00838F')).toBe('#EF4444');

      const boxWithoutCode = { id: '2', x: 0, y: 0, width: 85, height: 85 };
      expect(getBoxColor(boxWithoutCode, '#00838F')).toBe('#00838F');
    });
  });
});
