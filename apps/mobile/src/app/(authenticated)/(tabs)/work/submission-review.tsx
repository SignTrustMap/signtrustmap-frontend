import { useLocalSearchParams } from 'expo-router';

import {
  SubmissionReviewScreen,
  type SubmissionReviewState,
} from '@/feature/review/pages/submission-review-screen';

const reviewStates: SubmissionReviewState[] = ['loading', 'ready', 'reviewed'];

export default function SubmissionReviewRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const reviewState = reviewStates.includes(state as SubmissionReviewState)
    ? (state as SubmissionReviewState)
    : 'ready';

  return <SubmissionReviewScreen state={reviewState} />;
}
