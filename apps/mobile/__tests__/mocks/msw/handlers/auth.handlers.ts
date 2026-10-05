import { http, HttpResponse } from 'msw';
import type { LoginRequest, RegisterRequest } from '@/api/auth/auth';
import {
  mockAuthErrorResponses,
  mockLoginRequests,
  mockLoginResponses,
  mockRegisterRequests,
  mockRegisterResponses,
  mockUsers,
} from '../fixtures/auth.fixtures';

// ---------------------------------------------------------------------------
// Helper: Pattern to match both absolute and relative backend URL paths
// ---------------------------------------------------------------------------
const LOGIN_PATH = '*/api/v1/auth/login';
const REGISTER_PATH = '*/api/v1/auth/register';

// ---------------------------------------------------------------------------
// 1. Default Authentication Handlers (Standard Project API Behavior)
// ---------------------------------------------------------------------------
export const authHandlers = [
  // -------------------------------------------------------------------------
  // POST /auth/login
  // -------------------------------------------------------------------------
  http.post(LOGIN_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<LoginRequest>;
    const email = body.email?.trim() ?? '';
    const password = body.password ?? '';

    // Scenario: Network disconnection simulation
    if (email === mockLoginRequests.networkErrorTrigger.email) {
      return HttpResponse.error();
    }

    // Scenario: 500 Internal Server Error
    if (email === mockLoginRequests.serverErrorTrigger.email) {
      return HttpResponse.json(mockAuthErrorResponses.serverError, { status: 500 });
    }

    // Scenario: 403 Forbidden (Deactivated Account)
    if (email === mockUsers.deactivated.email) {
      return HttpResponse.json(mockAuthErrorResponses.forbidden, { status: 403 });
    }

    // Scenario: Explicit wrong password
    if (password === mockLoginRequests.invalidWrongPassword.password) {
      return HttpResponse.json(mockAuthErrorResponses.unauthorized, { status: 401 });
    }

    // Preset: Demo User (All roles: driver, reviewer, surveyor)
    if (email === mockUsers.demo.email && password === mockUsers.demo.password) {
      return HttpResponse.json(mockLoginResponses.demo, { status: 200 });
    }

    // Preset: Reviewer 1
    if (email === mockUsers.reviewer1.email && password === mockUsers.reviewer1.password) {
      return HttpResponse.json(mockLoginResponses.reviewer1, { status: 200 });
    }

    // Preset: Other Reviewers (Reviewer 2, 3, 4, 5 for consensus testing)
    const reviewerMatch = email.match(/^reviewer(\d+)@stm\.dev$/i);
    if (reviewerMatch && (password === 'Reviewer@123' || password === mockUsers.reviewer1.password)) {
      const num = reviewerMatch[1];
      return HttpResponse.json(
        {
          accessToken: `mock-jwt-token-reviewer-${num}`,
          user: {
            id: `user-reviewer-${num}`,
            email: `reviewer${num}@stm.dev`,
            fullName: `Reviewer ${num}`,
            roles: ['REVIEWER'],
          },
        },
        { status: 200 }
      );
    }

    // Preset: Surveyor
    if (email === mockUsers.surveyor.email && password === mockUsers.surveyor.password) {
      return HttpResponse.json(mockLoginResponses.surveyor, { status: 200 });
    }

    // Preset: Driver
    if (email === mockUsers.driver.email && password === mockUsers.driver.password) {
      return HttpResponse.json(mockLoginResponses.driver, { status: 200 });
    }

    // General Valid Login fallback for newly registered or test users
    if (email && email.includes('@') && password.length > 1 && email !== 'notfound@stm.dev') {
      return HttpResponse.json(
        {
          accessToken: `mock-jwt-token-${email.replace(/[^a-zA-Z0-9]/g, '-')}`,
          user: {
            id: `user-${email.split('@')[0]}`,
            email,
            fullName: email.split('@')[0].toUpperCase(),
            roles: ['DRIVER'],
          },
        },
        { status: 200 }
      );
    }

    // Default 401 Unauthorized for bad credentials or missing fields
    return HttpResponse.json(mockAuthErrorResponses.unauthorized, { status: 401 });
  }),

  // -------------------------------------------------------------------------
  // POST /auth/register
  // -------------------------------------------------------------------------
  http.post(REGISTER_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<RegisterRequest>;
    const email = body.email?.trim() ?? '';
    const password = body.password ?? '';

    // Scenario: Network disconnection simulation
    if (email === mockRegisterRequests.networkErrorTrigger.email) {
      return HttpResponse.error();
    }

    // Scenario: 500 Internal Server Error
    if (email === mockRegisterRequests.serverErrorTrigger.email) {
      return HttpResponse.json(mockAuthErrorResponses.serverError, { status: 500 });
    }

    // Scenario: 409 Conflict (Duplicate Email)
    if (email === mockUsers.demo.email || email === 'existing@stm.dev') {
      return HttpResponse.json(mockRegisterResponses.duplicateEmail, { status: 409 });
    }

    // Scenario: 400 Bad Request (Password too short)
    if (password.length > 0 && password.length < 8) {
      return HttpResponse.json(mockRegisterResponses.invalidData, { status: 400 });
    }

    // Scenario: Successful registration
    if (email && email.includes('@') && password.length >= 8) {
      return HttpResponse.json(mockRegisterResponses.success, { status: 201 });
    }

    // Default 400 Validation Error
    return HttpResponse.json(mockAuthErrorResponses.badRequest, { status: 400 });
  }),
];

// ---------------------------------------------------------------------------
// 2. Scenario Override Factories (For ad-hoc test behavior customization)
// ---------------------------------------------------------------------------
export const authScenarioHandlers = {
  /** Force login to always fail with a given status and error payload */
  loginError: (status = 401, errorBody: Record<string, any> = mockAuthErrorResponses.unauthorized) =>
    http.post(LOGIN_PATH, () => HttpResponse.json(errorBody, { status })),

  /** Force login to simulate network drop */
  loginNetworkError: () => http.post(LOGIN_PATH, () => HttpResponse.error()),

  /** Force login to succeed with a specific custom session payload */
  loginSuccess: (customResponse = mockLoginResponses.demo) =>
    http.post(LOGIN_PATH, () => HttpResponse.json(customResponse, { status: 200 })),

  /** Force registration to always fail with a given status and error payload */
  registerError: (status = 409, errorBody: Record<string, any> = mockRegisterResponses.duplicateEmail) =>
    http.post(REGISTER_PATH, () => HttpResponse.json(errorBody, { status })),

  /** Force registration to simulate network drop */
  registerNetworkError: () => http.post(REGISTER_PATH, () => HttpResponse.error()),

  /** Force registration to succeed with custom response */
  registerSuccess: (customResponse = mockRegisterResponses.success) =>
    http.post(REGISTER_PATH, () => HttpResponse.json(customResponse, { status: 201 })),
};
