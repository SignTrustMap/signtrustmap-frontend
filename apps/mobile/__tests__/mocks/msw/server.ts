import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';
import { reviewHandlers } from './handlers/review.handlers';
import { submissionHandlers } from './handlers/submission.handlers';
import { navigationHandlers } from './handlers/navigation.handlers';

/**
 * Mock Service Worker (MSW) server instance for Node.js / Jest testing environment.
 * Default handlers intercept auth, review, submission, and navigation endpoints.
 */
export const server = setupServer(
  ...authHandlers,
  ...reviewHandlers,
  ...submissionHandlers,
  ...navigationHandlers,
);



