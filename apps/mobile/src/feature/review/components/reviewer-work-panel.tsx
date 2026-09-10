import { useRouter } from 'expo-router';

import { WorkActionCard } from '@/feature/work/components/work-action-card';

export function ReviewerWorkPanel() {
  const router = useRouter();
  // TODO: Show the count of survey submissions with status QUEUED when a
  // reviewer-accessible endpoint is available. /reviews/queue counts candidates
  // in PENDING_REVIEW/IN_CONSENSUS, not queued submissions. /submissions/me/pending
  // is SURVEYOR/ADMIN-only and counts only the current user's submissions.
  // Omit the badge until the correct API exists rather than display a mock total.

  return (
    <WorkActionCard
      label="Pending Reviews"
      onPress={() => router.push('/work/submission-review')}
      symbol={{ android: 'fact_check', ios: 'checkmark.rectangle.stack', web: 'fact_check' }}
    />
  );
}
