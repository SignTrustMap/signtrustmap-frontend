import { SubmissionCompleteScreen } from '@/feature/work/pages/submission-complete-screen';

export type SubmissionFinishedScreenProps = {
  reviewedCount: number;
};

export function SubmissionFinishedScreen({ reviewedCount }: SubmissionFinishedScreenProps) {
  return (
    <SubmissionCompleteScreen
      count={reviewedCount}
      title="Hoàn tất thẩm định"
      type="review_submission"
    />
  );
}

