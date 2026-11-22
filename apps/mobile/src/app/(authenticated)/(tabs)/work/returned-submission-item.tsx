import { useLocalSearchParams } from 'expo-router';
import { ReturnedSubmissionItemScreen } from '@/feature/work/pages/returned-submission-item-screen';

export default function ReturnedSubmissionItemRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <ReturnedSubmissionItemScreen id={id} />;
}
