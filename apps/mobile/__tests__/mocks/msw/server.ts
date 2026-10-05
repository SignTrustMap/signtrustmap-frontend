import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';
import { reviewHandlers } from './handlers/review.handlers';

/**
 * Mock Service Worker (MSW) server instance for Node.js / Jest testing environment.
 * Default handlers intercept auth and review endpoints. Additional handlers can be passed
 * to server.use(...) dynamically per test file or test suite.
 */
export const server = setupServer(...authHandlers, ...reviewHandlers);

