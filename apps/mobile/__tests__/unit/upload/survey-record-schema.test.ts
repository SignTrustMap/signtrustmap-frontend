import {
  surveyRecordFormSchema,
  validateCapturedDate,
  parseFlexibleCapturedDate,
} from '@/feature/upload/schemas/survey-record.schema';
import {
  CAPTURE_TIME_FUTURE_MESSAGE,
  CAPTURE_TIME_TOO_OLD_MESSAGE,
  ENTER_MEDIA_DATETIME_MESSAGE,
} from '@/constants/message';

describe('surveyRecordFormSchema & validateCapturedDate', () => {
  it('rejects empty or whitespace-only capturedAt', () => {
    expect(validateCapturedDate('')).toEqual({
      isValid: false,
      error: ENTER_MEDIA_DATETIME_MESSAGE,
    });
    expect(validateCapturedDate('   ')).toEqual({
      isValid: false,
      error: ENTER_MEDIA_DATETIME_MESSAGE,
    });
    expect(validateCapturedDate(undefined)).toEqual({
      isValid: false,
      error: ENTER_MEDIA_DATETIME_MESSAGE,
    });
  });

  it('rejects non-date gibberish', () => {
    const res = validateCapturedDate('not-a-date');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe(ENTER_MEDIA_DATETIME_MESSAGE);
  });

  it('rejects dates more than 5 minutes in the future', () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const res = validateCapturedDate(futureDate);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe(CAPTURE_TIME_FUTURE_MESSAGE);
  });

  it('accepts dates within 5 minutes in the future', () => {
    const slightFuture = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const res = validateCapturedDate(slightFuture);
    expect(res.isValid).toBe(true);
  });

  it('rejects dates older than 30 days', () => {
    const oldDate = new Date(Date.now() - 31 * 86400 * 1000).toISOString();
    const res = validateCapturedDate(oldDate);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe(CAPTURE_TIME_TOO_OLD_MESSAGE);
  });

  it('accepts dates within 30 days', () => {
    const recentDate = new Date(Date.now() - 5 * 86400 * 1000).toISOString();
    const res = validateCapturedDate(recentDate);
    expect(res.isValid).toBe(true);
  });

  it('correctly parses Vietnamese DD/MM/YYYY format', () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formatted = `${day}/${month}/${year}`;

    const parsed = parseFlexibleCapturedDate(formatted);
    expect(Number.isFinite(parsed)).toBe(true);

    const res = validateCapturedDate(formatted);
    expect(res.isValid).toBe(true);
  });

  it('validates entire form schema with valid note and date', () => {
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}/${now.getFullYear()}`;

    const validData = {
      capturedAt: formatted,
      note: 'Biển báo khu dân cư tốc độ tối đa 50km/h',
    };

    const parseResult = surveyRecordFormSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it('rejects notes exceeding 1000 characters', () => {
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}/${now.getFullYear()}`;

    const invalidData = {
      capturedAt: formatted,
      note: 'a'.repeat(1001),
    };

    const parseResult = surveyRecordFormSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });
});
