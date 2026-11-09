export const REVALIDATION_STATUS_LABELS = {
  FRESH: 'Vừa được xác thực',
  ATTENTION_YELLOW: 'Cần chú ý',
  ATTENTION_RED: 'Cần chú ý',
  NEEDS_REVALIDATION: 'Cần tái thẩm định',
} as const;

export type RevalidationStatusLabel =
  typeof REVALIDATION_STATUS_LABELS[keyof typeof REVALIDATION_STATUS_LABELS];
