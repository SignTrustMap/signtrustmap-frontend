import { useMutation } from '@tanstack/react-query';

import {
  forgotPassword,
  resendOtp,
  resetPassword,
  verifyOtp,
  type ForgotPasswordRequest,
  type ForgotPasswordResponse,
  type ResendOtpRequest,
  type ResendOtpResponse,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
  type VerifyOtpRequest,
  type VerifyOtpResponse,
} from '@/api/auth/auth';

export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordRequest>({
    mutationKey: ['auth', 'forgot-password'],
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    mutationFn: (request: ForgotPasswordRequest) => forgotPassword(request),
  });
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, Error, VerifyOtpRequest>({
    mutationKey: ['auth', 'verify-otp'],
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    mutationFn: (request: VerifyOtpRequest) => verifyOtp(request),
  });
}

export function useResendOtp() {
  return useMutation<ResendOtpResponse, Error, ResendOtpRequest>({
    mutationKey: ['auth', 'resend-otp'],
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    mutationFn: (request: ResendOtpRequest) => resendOtp(request),
  });
}

export function useResetPassword() {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
    mutationKey: ['auth', 'reset-password'],
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    mutationFn: (request: ResetPasswordRequest) => resetPassword(request),
  });
}
