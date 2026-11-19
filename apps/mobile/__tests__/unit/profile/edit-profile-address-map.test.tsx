import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

import { EditProfileScreen } from '@/feature/profile/pages/edit-profile-screen';
import * as authApi from '@/api/auth/auth';
import * as placesApi from '@/api/navigation/places';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUpdateAccount = jest.fn();
let mockSessionData: any = {
  accessToken: 'test-token',
  account: {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'Nguyen Van A',
    roles: ['driver'],
    avatarUrl: null,
    address: '123 Le Loi, Ben Nghe, Quan 1, TP.HCM',
  },
};

jest.mock('@/context/session-provider', () => {
  const actual = jest.requireActual('@/context/session-provider');
  return {
    ...actual,
    useSession: () => ({
      session: mockSessionData,
      isLoading: false,
      isInitializing: false,
      logIn: jest.fn(),
      logOut: jest.fn(),
      setRoleEnabled: jest.fn(),
      updateAccount: mockUpdateAccount,
    }),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    surface: '#FFFFFF',
    text: '#0F172A',
    placeholder: '#94A3B8',
    border: '#E2E8F0',
    primary: '#007B8B',
    onPrimary: '#FFFFFF',
    secondary: '#E0F7FA',
    danger: '#EF4444',
    grey: '#64748B',
  }),
}));

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/api/auth/auth', () => ({
  getProfile: jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    avatarUrl: null,
    roles: ['driver'],
    address: '123 Le Loi, Ben Nghe, Quan 1, TP.HCM',
  }),
  updateProfile: jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    avatarUrl: null,
    roles: ['driver'],
    address: '456 Nguyen Hue, Ben Nghe, Quan 1, TP.HCM',
  }),
}));

const mockSearchPlaces = jest.spyOn(placesApi, 'searchPlaces');

jest.mock('@/feature/upload/components/location-picker-modal', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');
  return {
    LocationPickerModal: ({ visible, onConfirm, onClose, initialCoordinate }: any) => {
      if (!visible) return null;
      return (
        <View testID="mock-location-picker-modal">
          <Text testID="modal-initial-coord">
            {initialCoordinate ? `${initialCoordinate[0]},${initialCoordinate[1]}` : ''}
          </Text>
          <Pressable
            testID="confirm-picker-btn"
            onPress={() => onConfirm([106.7025, 10.7758], '789 Dong Khoi, Ben Nghe, Quan 1, TP.HCM')}
          >
            <Text>Xác nhận vị trí</Text>
          </Pressable>
          <Pressable testID="close-picker-btn" onPress={onClose}>
            <Text>Đóng</Text>
          </Pressable>
        </View>
      );
    },
  };
});

describe('EditProfileScreen Address Autocomplete & Map Preview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchPlaces.mockResolvedValue([
      {
        id: 'place-1',
        title: 'Chợ Bến Thành',
        address: 'Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
        latitude: 10.7725,
        longitude: 106.698,
        type: 'recent',
      },
      {
        id: 'place-2',
        title: 'Phố đi bộ Nguyễn Huệ',
        address: 'Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
        latitude: 10.7745,
        longitude: 106.7035,
        type: 'recent',
      },
    ]);
  });

  it('renders address field with mini map preview card, pin, and floating zoom button', async () => {
    const screen = await render(<EditProfileScreen />);

    // Address input should be present
    expect(screen.getByLabelText('Địa chỉ')).toBeTruthy();

    // Mini map preview card should be rendered
    expect(screen.getByTestId('profile-mini-map-card')).toBeTruthy();
    expect(screen.getByTestId('profile-map-pin')).toBeTruthy();

    // Floating Zoom Button should be rendered in bottom right
    const zoomBtn = screen.getByTestId('mini-map-zoom-btn');
    expect(zoomBtn).toBeTruthy();
    expect(zoomBtn.props.accessibilityLabel).toBe('Xem phóng to bản đồ');
  });

  it('debounces address typing and shows address suggestions dropdown', async () => {
    const screen = await render(<EditProfileScreen />);

    const addressInput = screen.getByLabelText('Địa chỉ');

    // Type into address input
    await act(async () => {
      fireEvent.changeText(addressInput, 'Cho Ben Thanh');
    });

    // Wait for debounce (350ms) and API response
    await waitFor(
      () => {
        expect(mockSearchPlaces).toHaveBeenCalledWith('Cho Ben Thanh', expect.any(Object));
      },
      { timeout: 1500 }
    );

    // Suggestions container should appear
    const suggestionsContainer = await screen.findByTestId('address-suggestions-container');
    expect(suggestionsContainer).toBeTruthy();

    // Suggestion items should be visible
    expect(screen.getByText('Chợ Bến Thành')).toBeTruthy();
    expect(screen.getByText('Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM')).toBeTruthy();
    expect(screen.getByText('Phố đi bộ Nguyễn Huệ')).toBeTruthy();
  });

  it('selecting an address suggestion fills the address input and closes suggestions', async () => {
    const screen = await render(<EditProfileScreen />);

    const addressInput = screen.getByLabelText('Địa chỉ');

    await act(async () => {
      fireEvent.changeText(addressInput, 'Nguyen Hue');
    });

    await waitFor(() => {
      expect(mockSearchPlaces).toHaveBeenCalled();
    });

    // Select the second suggestion
    const secondSuggestion = await screen.findByTestId('address-suggestion-1');
    await act(async () => {
      fireEvent.press(secondSuggestion);
    });

    // Address input should now contain the selected address
    expect(addressInput.props.value).toBe('Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM');

    // Suggestions dropdown should be hidden
    expect(screen.queryByTestId('address-suggestions-container')).toBeNull();
  });

  it('pressing floating zoom button opens fullscreen map modal and confirming updates address', async () => {
    const screen = await render(<EditProfileScreen />);

    // Initially modal is not mounted
    expect(screen.queryByTestId('mock-location-picker-modal')).toBeNull();

    // Press floating zoom button
    const zoomBtn = screen.getByTestId('mini-map-zoom-btn');
    await act(async () => {
      fireEvent.press(zoomBtn);
    });

    // Fullscreen modal should now be visible
    expect(screen.getByTestId('mock-location-picker-modal')).toBeTruthy();

    // Confirm location from modal
    const confirmPickerBtn = screen.getByTestId('confirm-picker-btn');
    await act(async () => {
      fireEvent.press(confirmPickerBtn);
    });

    // Modal should close and address should be updated
    expect(screen.queryByTestId('mock-location-picker-modal')).toBeNull();
    const addressInput = screen.getByLabelText('Địa chỉ');
    expect(addressInput.props.value).toBe('789 Dong Khoi, Ben Nghe, Quan 1, TP.HCM');
  });

  it('clearing address via clear button resets address input and suggestions', async () => {
    const screen = await render(<EditProfileScreen />);

    const addressInput = screen.getByLabelText('Địa chỉ');

    await act(async () => {
      fireEvent.changeText(addressInput, 'Cho Ben Thanh');
    });

    const clearBtn = screen.getByTestId('clear-address-btn');
    await act(async () => {
      fireEvent.press(clearBtn);
    });

    expect(addressInput.props.value).toBe('');
    expect(screen.queryByTestId('address-suggestions-container')).toBeNull();
  });
});
