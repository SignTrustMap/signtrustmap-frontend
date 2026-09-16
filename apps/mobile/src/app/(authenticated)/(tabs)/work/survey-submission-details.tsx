import { useLocalSearchParams } from 'expo-router';

import { SurveySubmissionDetailsScreen } from '@/feature/upload/pages/survey-submission-details-screen';

export default function SurveySubmissionDetailsRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <SurveySubmissionDetailsScreen submissionId={id} />;
}
