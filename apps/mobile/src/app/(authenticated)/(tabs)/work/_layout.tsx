import { Slot } from 'expo-router';

import { ReviewWorkflowProvider } from '@/feature/review/context/review-workflow-provider';
import { RevalidationWorkflowProvider } from '@/feature/revalidation/context/revalidation-workflow-provider';

export default function WorkLayout() {
  return (
    <ReviewWorkflowProvider>
      <RevalidationWorkflowProvider>
        <Slot />
      </RevalidationWorkflowProvider>
    </ReviewWorkflowProvider>
  );
}
