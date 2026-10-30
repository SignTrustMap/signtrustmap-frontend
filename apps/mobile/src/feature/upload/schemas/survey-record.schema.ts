import { z } from 'zod';
import {
  CAPTURE_TIME_FUTURE_MESSAGE,
  CAPTURE_TIME_TOO_OLD_MESSAGE,
  ENTER_MEDIA_DATETIME_MESSAGE,
  NOTE_TOO_LONG_MESSAGE,
} from '@/constants/message';

export const FIVE_MINUTES_MS = 5 * 60 * 1000;
export const THIRTY_DAYS_MS = 30 * 86400 * 1000;

export function parseFlexibleCapturedDate(dateStr?: string | null): number {
  if (!dateStr) return NaN;
  const trimmed = dateStr.trim();
  if (!trimmed) return NaN;

  // Support Vietnamese format DD/MM/YYYY or DD/MM/YYYY HH:mm:ss
  const ddmmyyyyMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
  );
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(ddmmyyyyMatch[3], 10);

    const now = new Date();
    const isToday =
      year === now.getFullYear() &&
      month === now.getMonth() &&
      day === now.getDate();

    let hours: number;
    let minutes: number;
    let seconds: number;

    if (ddmmyyyyMatch[4] !== undefined) {
      hours = parseInt(ddmmyyyyMatch[4], 10);
      minutes = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
      seconds = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
    } else if (isToday) {
      hours = now.getHours();
      minutes = now.getMinutes();
      seconds = now.getSeconds();
    } else {
      hours = 12;
      minutes = 0;
      seconds = 0;
    }

    const date = new Date(year, month, day, hours, minutes, seconds);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return NaN;
    }
    return date.getTime();
  }
  return Date.parse(trimmed);
}

export function validateCapturedDate(dateStr?: string | null): {
  isValid: boolean;
  error?: string;
  timestamp?: number;
} {
  const result = surveyRecordFormSchema.shape.capturedAt.safeParse(dateStr);
  if (!result.success) {
    return {
      isValid: false,
      error: result.error.errors[0]?.message ?? ENTER_MEDIA_DATETIME_MESSAGE,
    };
  }
  return {
    isValid: true,
    timestamp: parseFlexibleCapturedDate(dateStr),
  };
}

export const surveyRecordFormSchema = z.object({
  capturedAt: z
    .string({ required_error: ENTER_MEDIA_DATETIME_MESSAGE })
    .trim()
    .min(1, ENTER_MEDIA_DATETIME_MESSAGE)
    .superRefine((val, ctx) => {
      const ts = parseFlexibleCapturedDate(val);
      if (!Number.isFinite(ts)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: ENTER_MEDIA_DATETIME_MESSAGE,
        });
        return;
      }
      const now = Date.now();
      if (ts > now + FIVE_MINUTES_MS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: CAPTURE_TIME_FUTURE_MESSAGE,
        });
        return;
      }
      if (ts < now - THIRTY_DAYS_MS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: CAPTURE_TIME_TOO_OLD_MESSAGE,
        });
        return;
      }
    }),
  note: z.string().max(1000, NOTE_TOO_LONG_MESSAGE).default(''),
});

export type SurveyRecordFormData = z.infer<typeof surveyRecordFormSchema>;
