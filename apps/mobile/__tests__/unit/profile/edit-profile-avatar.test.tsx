import React from 'react';
import { Alert, Image } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { EditProfileScreen } from '@/feature/profile/pages/edit-profile-screen';
import { AvatarCropModal } from '@/feature/profile/components/avatar-crop-modal';
import { ProfileScreen } from '@/feature/profile/pages/profile-screen';
import * as authApi from '@/api/auth/auth';

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
  }),
  updateProfile: jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    avatarUrl: 'file:///path/to/cropped-avatar.jpg',
    roles: ['driver'],
  }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn(),
}));

describe('Profile Avatar Update & Crop Modal Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => {
      if (typeof success === 'function') {
        success(400, 400);
      }
    });
    mockSessionData = {
      accessToken: 'test-token',
      account: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Nguyen Van A',
        roles: ['driver'],
        avatarUrl: null,
      },
    };
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('EditProfileScreen Avatar & Badge UI', () => {
    it('renders initials and the plus badge icon on the avatar', async () => {
      const screen = await render(<EditProfileScreen />);

      await waitFor(() => {
        expect(screen.getByText('NV')).toBeTruthy();
      });

      // Avatar touchable has accessibilityLabel
      const avatarButton = screen.getByLabelText('Thay đổi ảnh đại diện');
      expect(avatarButton).toBeTruthy();
    });

    it('launches image picker when clicking on avatar', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///data/user/avatar.jpg' }],
      });

      const screen = await render(<EditProfileScreen />);

      const avatarButton = screen.getByLabelText('Thay đổi ảnh đại diện');
      fireEvent.press(avatarButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
        });
      });
    });

    it('does not call backend API immediately when confirming crop, but updates avatar temporarily and calls API only on Save', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///data/user/avatar.jpg' }],
      });

      const screen = await render(<EditProfileScreen />);

      // Step 1: Click avatar to pick image
      const avatarButton = screen.getByLabelText('Thay đổi ảnh đại diện');
      fireEvent.press(avatarButton);

      // Step 2: Crop modal is displayed -> click Confirm
      await waitFor(() => {
        expect(screen.getByText('Căn chỉnh ảnh đại diện')).toBeTruthy();
      });

      const confirmButton = screen.getByLabelText('Xác nhận ảnh đại diện');
      fireEvent.press(confirmButton);

      // Verify: API updateProfile is NOT called yet!
      expect(authApi.updateProfile).not.toHaveBeenCalled();

      // UI hint updates to show uncommitted state
      await waitFor(() => {
        expect(
          screen.getByText('Ảnh mới (chưa lưu, nhấn Lưu thay đổi bên dưới)'),
        ).toBeTruthy();
      });

      // Step 3: Click "Lưu thay đổi" (Save changes)
      const saveButton = screen.getByLabelText('Lưu thông tin hồ sơ');
      fireEvent.press(saveButton);

      // Verify: Now API updateProfile is called with the temp avatar URI!
      await waitFor(() => {
        expect(authApi.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Nguyen Van A',
            avatarUrl: 'file:///data/user/avatar.jpg',
          }),
          'test-token',
        );
      });

      // Verify updateAccount session update
      expect(mockUpdateAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: 'file:///path/to/cropped-avatar.jpg',
        }),
      );
    });

    it('renders and allows editing phone, address, and displays read-only email', async () => {
      const screen = await render(<EditProfileScreen />);

      // Wait for initial profile load to complete
      await waitFor(() => {
        expect(screen.queryByText('Đang tải thông tin...')).toBeNull();
      });

      const phoneInput = screen.getByPlaceholderText('Nhập số điện thoại liên hệ');
      expect(phoneInput).toBeTruthy();
      await act(async () => {
        fireEvent.changeText(phoneInput, '0987654321');
      });

      const addressInput = screen.getByPlaceholderText('Nhập địa chỉ của bạn');
      expect(addressInput).toBeTruthy();
      await act(async () => {
        fireEvent.changeText(addressInput, '123 Nguyen Trai, Q1, HCM');
      });

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeTruthy();
      expect(emailInput.props.editable).toBe(false);

      const saveButton = screen.getByLabelText('Lưu thông tin hồ sơ');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(authApi.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Nguyen Van A',
            phone: '0987654321',
            address: '123 Nguyen Trai, Q1, HCM',
          }),
          'test-token',
        );
      });
    });
  });

  describe('AvatarCropModal Component', () => {
    it('renders crop circle viewport and handles cancel', async () => {
      const mockCancel = jest.fn();
      const mockConfirm = jest.fn();

      const screen = await render(
        <AvatarCropModal
          imageUri="file:///test.jpg"
          onCancel={mockCancel}
          onConfirm={mockConfirm}
          visible={true}
        />,
      );

      expect(screen.getByText('Căn chỉnh ảnh đại diện')).toBeTruthy();
      expect(screen.getByLabelText('Vòng tròn căn chỉnh ảnh')).toBeTruthy();

      const cancelBtn = screen.getByLabelText('Hủy chọn ảnh');
      fireEvent.press(cancelBtn);
      expect(mockCancel).toHaveBeenCalled();
      expect(mockConfirm).not.toHaveBeenCalled();
    });

    it('handles confirm and invokes onConfirm callback with imageUri', async () => {
      const mockCancel = jest.fn();
      const mockConfirm = jest.fn();

      const screen = await render(
        <AvatarCropModal
          imageUri="file:///test.jpg"
          onCancel={mockCancel}
          onConfirm={mockConfirm}
          visible={true}
        />,
      );

      const confirmBtn = screen.getByLabelText('Xác nhận ảnh đại diện');
      fireEvent.press(confirmBtn);

      expect(mockConfirm).toHaveBeenCalledWith('file:///test.jpg');
    });
  });

  describe('ProfileScreen Avatar Image Display', () => {
    it('renders image when avatarUrl exists in session', async () => {
      mockSessionData = {
        accessToken: 'test-token',
        account: {
          id: 'user-1',
          email: 'user@example.com',
          displayName: 'Nguyen Van A',
          roles: ['driver'],
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      };

      const screen = await render(<ProfileScreen />);
      const avatar = screen.getByLabelText('Ảnh đại diện của Nguyen Van A');
      expect(avatar).toBeTruthy();
    });
  });
});
