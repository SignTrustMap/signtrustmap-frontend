import { ACCOUNT_ROLES, type AppSession } from '@/context/session-provider';

export function createFakeSession(email = 'demo@example.com'): AppSession {
  return {
    accessToken: 'fake-session-token',
    account: {
      displayName: 'Demo User',
      email,
      id: 'demo-account',
      roles: [...ACCOUNT_ROLES],
    },
  };
}
