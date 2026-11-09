import { z } from 'zod';

export const editProfileSchema = z.object({
  fullName: z
    .string({ required_error: 'Họ và tên không được để trống.' })
    .trim()
    .min(1, 'Họ và tên không được để trống.')
    .max(100, 'Họ và tên không được quá 100 ký tự.'),
  phone: z
    .string()
    .trim()
    .max(20, 'Số điện thoại không được quá 20 ký tự.')
    .refine(
      (val) => !val || /^[0-9+()\-.\s]{7,20}$/.test(val),
      'Số điện thoại không hợp lệ.',
    )
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(200, 'Địa chỉ không được quá 200 ký tự.')
    .optional()
    .or(z.literal('')),
});

export type EditProfileFormData = z.infer<typeof editProfileSchema>;
