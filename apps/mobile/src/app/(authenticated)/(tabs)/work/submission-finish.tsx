import { useLocalSearchParams } from 'expo-router';

import { SubmissionFinishedScreen } from '@/feature/review/pages/submission-finished-screen';

export default function SubmissionCompleteRoute() {
  const { count } = useLocalSearchParams<{ count?: string }>();
  const reviewedCount = Number.parseInt(count ?? '0', 10);

  return <SubmissionFinishedScreen reviewedCount={Number.isNaN(reviewedCount) ? 0 : reviewedCount} />;
}
