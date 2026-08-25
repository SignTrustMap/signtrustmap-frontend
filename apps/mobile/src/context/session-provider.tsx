import { getStorageItemAsync, removeStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

export const ACCOUNT_ROLES = ['driver', 'surveyor', 'reviewer'] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];
export type OptionalAccountRole = Exclude<AccountRole, 'driver'>;

export type Account = {
  displayName: string;
  email: string;
  id: string;
  roles: AccountRole[];
};

export type AppSession = {
  accessToken: string;
  account: Account;
};

type SessionContextValue = {
  isInitializing: boolean;
  isLoading: boolean;
  logIn: (session: AppSession) => Promise<void>;
  logOut: () => Promise<void>;
  session: AppSession | null;
  setRoleEnabled: (role: OptionalAccountRole, enabled: boolean) => Promise<void>;
};

const AuthContext = createContext<SessionContextValue | null>(null);

export const useSession = () => {
  const value = use(AuthContext);

  if (!value) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return value;
};

function normalizeRoles(roles: unknown): AccountRole[] {
  const requestedRoles = Array.isArray(roles)
    ? roles.filter((role): role is AccountRole => ACCOUNT_ROLES.includes(role as AccountRole))
    : [];

  return ACCOUNT_ROLES.filter((role) => role === 'driver' || requestedRoles.includes(role));
}

function parseStoredSession(value: string | null): AppSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<AppSession>;

    if (!parsed.accessToken || !parsed.account?.id) return null;

    return {
      accessToken: parsed.accessToken,
      account: {
        displayName: parsed.account.displayName ?? 'Demo User',
        email: parsed.account.email ?? 'demo@example.com',
        id: parsed.account.id,
        roles: normalizeRoles(parsed.account.roles),
      },
    };
  } catch {
    // Upgrade the previous fake token-only session without signing the user out.
    return {
      accessToken: value,
      account: {
        displayName: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-account',
        roles: [...ACCOUNT_ROLES],
      },
    };
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const storedSession = await getStorageItemAsync('session');
        setSession(parseStoredSession(storedSession));
      } finally {
        setIsInitializing(false);
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  async function logIn(nextSession: AppSession) {
    const normalizedSession = {
      ...nextSession,
      account: {
        ...nextSession.account,
        roles: normalizeRoles(nextSession.account.roles),
      },
    };

    await setStorageItemAsync('session', JSON.stringify(normalizedSession));
    setSession(normalizedSession);
  }

  async function logOut() {
    setSession(null);
    await removeStorageItemAsync('session');
  }

  async function setRoleEnabled(role: OptionalAccountRole, enabled: boolean) {
    if (!session) return;

    const nextRoles = enabled
      ? normalizeRoles([...session.account.roles, role])
      : session.account.roles.filter((accountRole) => accountRole !== role);
    const nextSession = {
      ...session,
      account: {
        ...session.account,
        roles: nextRoles,
      },
    };

    setSession(nextSession);
    await setStorageItemAsync('session', JSON.stringify(nextSession));
  }

  return (
    <AuthContext.Provider
      value={{ isInitializing, isLoading, logIn, logOut, session, setRoleEnabled }}
    >
      {children}
    </AuthContext.Provider>
  );
}
