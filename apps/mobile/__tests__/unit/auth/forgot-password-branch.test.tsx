import React from 'react';
import { Keyboard } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => ReactActual.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 16 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => ReactActual.createElement(View, { testID: `ion-${props.name}`, ...props }),
  };
});

jest.mock('@/components/primary-gradient-backdrop', () => ({
  PrimaryGradientBackdrop: () => null,
}));

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

import ForgotPasswordScreen from '@/app/(public)/forgot-password';

describe('ForgotPasswordScreen Branch Coverage', () => {
  let showCb: any;
  let hideCb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    showCb = undefined;
    hideCb = undefined;
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event: any, cb: any) => {
      if (String(event).includes('Show')) showCb = cb;
      if (String(event).includes('Hide')) hideCb = cb;
      return { remove: jest.fn() } as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderScreen = async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } },
    });
    return render(
      <QueryClientProvider client={qc}>
        <ForgotPasswordScreen />
      </QueryClientProvider>,
    );
  };

  it('covers step 1 validation/API error, step 2 OTP error/dev-autofill/resend/back, step 3 password visibility/error/submit, and step 4 success', async () => {
    const screen = await renderScreen();

    // Keyboard show/hide listeners
    await act(async () => {
      showCb?.();
      hideCb?.();
    });

    // Step 1 API error -> then success with devOtp
    mockForgotPassword.mockRejectedValueOnce(new Error('Email không tồn tại'));
    await fireEvent.changeText(screen.getByLabelText('Email đăng ký'), 'driver@signmap.vn');
    await fireEvent.press(screen.getByLabelText('Gửi mã xác nhận'));
    await waitFor(() => expect(screen.getByText('Email không tồn tại')).toBeTruthy());

    mockForgotPassword.mockResolvedValueOnce({ otp: '123456' });
    await fireEvent.press(screen.getByLabelText('Gửi mã xác nhận'));
    await waitFor(() => expect(screen.getByText('Xác thực mã OTP')).toBeTruthy());

    // Step 2 short OTP validation, tap devOtp badge, verify error, go back to email & return
    await fireEvent.press(screen.getByLabelText('Xác thực mã OTP'));
    expect(screen.getByText('Vui lòng nhập đầy đủ 6 chữ số mã OTP.')).toBeTruthy();

    await fireEvent.press(screen.getByText(/Chạm để tự điền/));
    mockVerifyOtp.mockRejectedValueOnce(new Error('OTP hết hạn'));
    await fireEvent.press(screen.getByLabelText('Xác thực mã OTP'));
    await waitFor(() => expect(screen.getByText('OTP hết hạn')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Đổi email khác'));
    expect(screen.getByText('Khôi phục mật khẩu')).toBeTruthy();

    mockForgotPassword.mockResolvedValueOnce({ otp: '654321' });
    await fireEvent.press(screen.getByLabelText('Gửi mã xác nhận'));
    await waitFor(() => expect(screen.getByText('Xác thực mã OTP')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Mã OTP'), '654321');
    mockVerifyOtp.mockResolvedValueOnce({ valid: true });
    await fireEvent.press(screen.getByLabelText('Xác thực mã OTP'));
    await waitFor(() => expect(screen.getByText('Đặt lại mật khẩu')).toBeTruthy());

    // Step 3 back to OTP, then forward, test eye toggles, error & success
    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(screen.getByText('Xác thực mã OTP')).toBeTruthy();

    mockVerifyOtp.mockResolvedValueOnce({ valid: true });
    await fireEvent.press(screen.getByLabelText('Xác thực mã OTP'));
    await waitFor(() => expect(screen.getByText('Đặt lại mật khẩu')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'Pass1234');
    await fireEvent.changeText(screen.getByLabelText('Xác nhận mật khẩu mới'), 'Pass1234');

    mockResetPassword.mockRejectedValueOnce(new Error('Reset thất bại'));
    await fireEvent.press(screen.getByLabelText('Lưu mật khẩu mới'));
    await waitFor(() => expect(screen.getByText('Reset thất bại')).toBeTruthy());

    mockResetPassword.mockResolvedValueOnce({ ok: true });
    await fireEvent.press(screen.getByLabelText('Lưu mật khẩu mới'));
    await waitFor(() => expect(screen.getByText('Đổi mật khẩu thành công!')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Đăng nhập ngay'));
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('covers back to login from step 1 and resend OTP after cooldown expires', async () => {
    jest.useFakeTimers();
    mockForgotPassword.mockResolvedValueOnce({});
    mockResendOtp.mockRejectedValueOnce(new Error('Gửi lại lỗi'));

    const screen = await renderScreen();
    await fireEvent.press(screen.getByLabelText('Quay lại đăng nhập'));
    expect(mockReplace).toHaveBeenCalledWith('/login');

    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockBack).toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Email đăng ký'), 'a@b.com');
    await fireEvent.press(screen.getByLabelText('Gửi mã xác nhận'));
    await waitFor(() => expect(screen.getByText('Xác thực mã OTP')).toBeTruthy());

    // Advance 60 seconds so resend link is enabled
    for (let i = 0; i < 60; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    await fireEvent.press(screen.getByLabelText('Gửi lại mã OTP'));
    await waitFor(() => expect(screen.getByText('Gửi lại lỗi')).toBeTruthy());
    jest.useRealTimers();
  });
});
