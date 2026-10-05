import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';

/**
 * Mock Service Worker (MSW) server instance for Node.js / Jest testing environment.
 * Default handlers intercept auth endpoints. Additional handlers can be passed
 * to server.use(...) dynamically per test file or test suite.
 */
export const server = setupServer(...authHandlers);
