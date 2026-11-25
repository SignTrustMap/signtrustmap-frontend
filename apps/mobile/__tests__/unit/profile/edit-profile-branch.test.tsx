import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => ReactActual.createElement(View, props, children),
  };
});

jest.mock('@/components/primary-gradient-backdrop', () => ({
  PrimaryGradientBackdrop: () => null,
}));

jest.mock('@/feature/profile/components/avatar-crop-modal', () => {
  const ReactActual = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    AvatarCropModal: ({ visible, onCancel, onConfirm }: any) =>
      visible
        ? ReactActual.createElement(
            View,
            { testID: 'mock-crop-modal' },
            ReactActual.createElement(Pressable, { testID: 'crop-confirm', onPress: () => onConfirm('file:///cropped.jpg') }, ReactActual.createElement(Text, null, 'OK')),
            ReactActual.createElement(Pressable, { testID: 'crop-cancel', onPress: onCancel }, ReactActual.createElement(Text, null, 'Cancel')),
          )
        : null,
  };
});

jest.mock('@/feature/profile/components/address-autocomplete-field', () => {
  const ReactActual = require('react');
  const { View, TextInput } = require('react-native');
  return {
    AddressAutocompleteField: (props: any) =>
      ReactActual.createElement(
        View,
        null,
        ReactActual.createElement(TextInput, {
          testID: 'addr-input',
          value: props.addressInput,
          onChangeText: props.onChangeText,
        }),
      ),
  };
});

const mockHydrateFromInitial = jest.fn();
const mockHandleAddressChange = jest.fn();
const mockHandleClearAddress = jest.fn();
const mockHandleMapConfirm = jest.fn();
const mockHandleSelectPlace = jest.fn();
const mockSetIsMapPickerOpen = jest.fn();
const mockSetIsSuggestionsVisible = jest.fn();
jest.mock('@/feature/profile/hooks/use-address-autocomplete', () => ({
  useAddressAutocomplete: ({ initialAddress, onSyncAddress }: any) => ({
    addressInput: initialAddress || '',
    addressSuggestions: [],
    focusRequestId: 1,
    handleAddressTextChange: (t: string, cb: any) => {
      mockHandleAddressChange(t);
      cb?.(t);
      onSyncAddress?.(t);
    },
    handleClearAddress: mockHandleClearAddress,
    handleMapConfirm: mockHandleMapConfirm,
    handleSelectPlace: mockHandleSelectPlace,
    hydrateFromInitialAddress: mockHydrateFromInitial,
    isLoadingSuggestions: false,
    isMapPickerOpen: false,
    isSuggestionsVisible: false,
    selectedCoordinate: [106.7, 10.77],
    setIsMapPickerOpen: mockSetIsMapPickerOpen,
    setIsSuggestionsVisible: mockSetIsSuggestionsVisible,
  }),
}));

const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();
jest.mock('@/api/auth/auth', () => ({
  getProfile: (...args: any[]) => mockGetProfile(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
}));

const mockUpdateAccount = jest.fn();
let mockSessionState: any = {
  session: {
    accessToken: 'tok-prof',
    account: { id: 'u-1', displayName: 'Nguyễn Văn A', email: 'a@signmap.vn', address: 'Q1' },
  },
  updateAccount: mockUpdateAccount,
};
jest.mock('@/context/session-provider', () => ({
  useSession: () => mockSessionState,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    danger: '#EF4444',
    text: '#0F172A',
  }),
}));

import { EditProfileScreen } from '@/feature/profile/pages/edit-profile-screen';

describe('EditProfileScreen Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionState = {
      session: {
        accessToken: 'tok-prof',
        account: { id: 'u-1', displayName: 'Nguyễn Văn A', email: 'a@signmap.vn', address: 'Q1' },
      },
      updateAccount: mockUpdateAccount,
    };
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('covers profile fetch, avatar pick/permission denied/crop, validation, save success & failure, and unauthenticated fallback', async () => {
    mockGetProfile.mockResolvedValue({
      fullName: 'Trần Văn B',
      phone: '0901234567',
      address: 'Quận 3',
      avatarUrl: 'https://cdn/av.jpg',
    });

    const screen = await render(<EditProfileScreen />);
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());

    // Avatar permission denied, exception, cancel, then crop confirm
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false });
    await fireEvent.press(screen.getByLabelText('Thay đổi ảnh đại diện'));
    expect(Alert.alert).toHaveBeenCalledWith('Quyền truy cập thư viện', expect.any(String));

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockRejectedValueOnce(new Error('Picker crash'));
    await fireEvent.press(screen.getByLabelText('Thay đổi ảnh đại diện'));

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///picked.jpg' }],
    });
    await fireEvent.press(screen.getByLabelText('Thay đổi ảnh đại diện'));
    await fireEvent.press(screen.getByTestId('crop-cancel'));

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///picked2.jpg' }],
    });
    await fireEvent.press(screen.getByLabelText('Thay đổi ảnh đại diện'));
    await fireEvent.press(screen.getByTestId('crop-confirm'));

    // Save failure -> then success + Alert OK back
    mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'));
    await fireEvent.press(screen.getByLabelText('Lưu thông tin hồ sơ'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Lỗi', 'Update failed'));

    mockUpdateProfile.mockResolvedValueOnce({
      fullName: 'Trần Văn B',
      avatarUrl: 'https://cdn/cropped.jpg',
      address: 'Quận 3',
    });
    await fireEvent.press(screen.getByLabelText('Lưu thông tin hồ sơ'));
    await waitFor(() => expect(mockUpdateAccount).toHaveBeenCalled());
    const okButtons = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2];
    okButtons?.[0]?.onPress?.();
    expect(mockBack).toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Quay lại'));
  });
});
