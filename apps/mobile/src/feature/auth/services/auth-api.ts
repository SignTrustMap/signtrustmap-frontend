import type { AppSession } from '@/context/session-provider';
import { login } from '@/api/auth';

// Compatibility wrapper for existing callers; the API module owns login.
export function logInWithPassword(email: string, password: string): Promise<AppSession> {
  return login({ email, password });
}
