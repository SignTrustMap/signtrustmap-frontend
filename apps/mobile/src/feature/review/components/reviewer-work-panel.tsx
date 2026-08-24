import { useRouter } from 'expo-router';

import { WorkActionCard } from '@/feature/work/components/work-action-card';

export function ReviewerWorkPanel() {
  const router = useRouter();

  return (
    <WorkActionCard
      count={4}
      label="Pending Reviews"
      onPress={() => router.push('/work/submission-review')}
      symbol={{ android: 'fact_check', ios: 'checkmark.rectangle.stack', web: 'fact_check' }}
    />
  );
}
