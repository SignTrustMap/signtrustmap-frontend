import React from 'react';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ForgotPasswordScreen from '@/app/(public)/forgot-password';

// 1. Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true,
  }),
}));

// 2. Mock Safe Area & Themes
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    text: '#0F172A',
    primary: '#007B8B',
  }),
}));

// 3. Mock API methods
const mockForgotPassword = jest.fn();
const mockVerifyOtp = jest.fn();
const mockResendOtp = jest.fn();
const mockResetPassword = jest.fn();

jest.mock('@/api/auth/auth', () => ({
  forgotPassword: (...args: any[]) => mockForgotPassword(...args),
  verifyOtp: (...args: any[]) => mockVerifyOtp(...args),
  resendOtp: (...args: any[]) => mockResendOtp(...args),
  resetPassword: (...args: any[]) => mockResetPassword(...args),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

async function renderScreen() {
  const client = createTestQueryClient();
  return await render(
    <QueryClientProvider client={client}>
      <ForgotPasswordScreen />
    </QueryClientProvider>,
  );
}

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it('renders step 1 with email input and submit button', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();

    expect(getByText('Khôi phục mật khẩu')).toBeTruthy();
    expect(getByPlaceholderText('vidu@domain.com')).toBeTruthy();
    expect(getByText('Gửi mã xác nhận')).toBeTruthy();
  });

  it('shows error if email is invalid', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('vidu@domain.com'), 'invalid-email');
    await fireEvent.press(getByText('Gửi mã xác nhận'));

    await waitFor(() => {
      expect(getByText('Vui lòng nhập địa chỉ email hợp lệ.')).toBeTruthy();
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('successfully moves to OTP step when email is submitted', async () => {
    mockForgotPassword.mockResolvedValueOnce({
      sent: true,
      otp: '654321',
      message: 'OTP sent to email',
    });

    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('vidu@domain.com'), 'user@stm.dev');
    await fireEvent.press(getByText('Gửi mã xác nhận'));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'user@stm.dev' });
      expect(getByText('Xác thực mã OTP')).toBeTruthy();
      expect(getByText(/DEV OTP:/)).toBeTruthy();
    });
  });

  it('handles OTP verification and advances to new password step', async () => {
    mockForgotPassword.mockResolvedValueOnce({ sent: true, otp: '123456' });
    mockVerifyOtp.mockResolvedValueOnce({ valid: true, email: 'user@stm.dev' });

    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('vidu@domain.com'), 'user@stm.dev');
    await fireEvent.press(getByText('Gửi mã xác nhận'));

    await waitFor(() => {
      expect(getByText('Xác thực mã OTP')).toBeTruthy();
    });

    await fireEvent.changeText(getByPlaceholderText('••••••'), '123456');
    await fireEvent.press(getByText('Xác thực & Tiếp tục'));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'user@stm.dev',
        otp: '123456',
      });
      expect(getByText('Đặt lại mật khẩu')).toBeTruthy();
    });
  });

  it('completes password reset and displays success step', async () => {
    mockForgotPassword.mockResolvedValueOnce({ sent: true, otp: '123456' });
    mockVerifyOtp.mockResolvedValueOnce({ valid: true, email: 'user@stm.dev' });
    mockResetPassword.mockResolvedValueOnce({ reset: true });

    const { getByText, getByPlaceholderText } = await renderScreen();

    // Step 1
    await fireEvent.changeText(getByPlaceholderText('vidu@domain.com'), 'user@stm.dev');
    await fireEvent.press(getByText('Gửi mã xác nhận'));

    // Step 2
    await waitFor(() => expect(getByText('Xác thực mã OTP')).toBeTruthy());
    await fireEvent.changeText(getByPlaceholderText('••••••'), '123456');
    await fireEvent.press(getByText('Xác thực & Tiếp tục'));

    // Step 3
    await waitFor(() => expect(getByText('Đặt lại mật khẩu')).toBeTruthy());
    await fireEvent.changeText(getByPlaceholderText('Tối thiểu 8 ký tự'), 'NewPass@123');
    await fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'NewPass@123');
    await fireEvent.press(getByText('Lưu mật khẩu mới'));

    // Step 4
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        email: 'user@stm.dev',
        otp: '123456',
        newPassword: 'NewPass@123',
      });
      expect(getByText('Đổi mật khẩu thành công!')).toBeTruthy();
      expect(getByText('Đăng nhập ngay')).toBeTruthy();
    });

    // Tap login button
    await fireEvent.press(getByText('Đăng nhập ngay'));
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
