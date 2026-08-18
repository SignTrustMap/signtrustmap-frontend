import { ACCOUNT_ROLES, type AppSession } from '@/context/session-provider';

export function createFakeSession(email = 'field.worker@example.com'): AppSession {
  return {
    accessToken: 'fake-session-token',
    account: {
      displayName: 'Demo Field Worker',
      email,
      id: 'demo-account',
      roles: [...ACCOUNT_ROLES],
    },
  };
}
