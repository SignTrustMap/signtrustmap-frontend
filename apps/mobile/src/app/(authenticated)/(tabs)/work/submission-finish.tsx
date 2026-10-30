import { useLocalSearchParams } from 'expo-router';
import { SubmissionCompleteScreen } from '@/feature/work/pages/submission-complete-screen';

export default function SubmissionCompleteRoute() {
  const { count } = useLocalSearchParams<{ count?: string }>();
  const reviewedCount = Number.parseInt(count ?? '0', 10);

  return (
    <SubmissionCompleteScreen
      count={Number.isNaN(reviewedCount) ? 0 : reviewedCount}
      type="review_submission"
    />
  );
}
