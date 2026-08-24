import { Slot } from 'expo-router';

import { ReviewWorkflowProvider } from '@/feature/review/context/review-workflow-provider';

export default function WorkLayout() {
  return (
    <ReviewWorkflowProvider>
      <Slot />
    </ReviewWorkflowProvider>
  );
}
