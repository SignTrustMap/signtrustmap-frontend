import { z } from 'zod';

export function createEditProfileSchema(requireAddress = false) {
  return z.object({
    fullName: z
      .string({ required_error: 'Họ và tên không được để trống.' })
      .trim()
      .min(1, 'Họ và tên không được để trống.')
      .max(100, 'Họ và tên không được quá 100 ký tự.'),
    phone: z
      .string()
      .trim()
      .max(10, 'Số điện thoại không được quá 10 số.')
      .refine(
        (val) => !val || /^[0-9]{7,10}$/.test(val),
        'Số điện thoại không hợp lệ.',
      )
      .optional()
      .or(z.literal('')),
    address: requireAddress
      ? z
          .string({ required_error: 'Vui lòng nhập địa chỉ để đăng ký vai trò.' })
          .trim()
          .min(1, 'Vui lòng nhập địa chỉ để đăng ký vai trò.')
          .max(200, 'Địa chỉ không được quá 200 ký tự.')
      : z
          .string()
          .trim()
          .max(200, 'Địa chỉ không được quá 200 ký tự.')
          .optional()
          .or(z.literal('')),
  });
}

export const editProfileSchema = createEditProfileSchema(false);

export type EditProfileFormData = z.infer<typeof editProfileSchema>;
