import { getStorageItemAsync, removeStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { SESSION_PROVIDER_REQUIRED_MESSAGE } from '@/constants/message';
import { toggleRole, backendRoleToAccountRole } from '@/api/auth/auth';

export const ACCOUNT_ROLES = ['driver', 'surveyor', 'reviewer'] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];
export type OptionalAccountRole = Exclude<AccountRole, 'driver'>;

export type Account = {
  displayName: string;
  email: string;
  id: string;
  roles: AccountRole[];
  registeredRoles?: AccountRole[];
  avatarUrl?: string | null;
  address?: string | null;
};

export type AppSession = {
  accessToken: string;
  account: Account;
};

export type SetRoleEnabledOptions = {
  throwOnError?: boolean;
};

type SessionContextValue = {
  isInitializing: boolean;
  isLoading: boolean;
  logIn: (session: AppSession) => Promise<void>;
  logOut: () => Promise<void>;
  session: AppSession | null;
  setRoleEnabled: (
    role: OptionalAccountRole,
    enabled: boolean,
    options?: SetRoleEnabledOptions,
  ) => Promise<void>;
  updateAccount?: (updates: Partial<Account>) => Promise<void>;
};

const AuthContext = createContext<SessionContextValue | null>(null);

export const useSession = () => {
  const value = use(AuthContext);

  if (!value) {
    throw new Error(SESSION_PROVIDER_REQUIRED_MESSAGE);
  }

  return value;
};

export const useOptionalSession = (): SessionContextValue | null => {
  return use(AuthContext);
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

    if (
      !parsed.accessToken ||
      parsed.accessToken === 'fake-session-token' ||
      !parsed.account?.id
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      account: {
        displayName: parsed.account.displayName ?? 'Demo User',
        email: parsed.account.email ?? 'demo@example.com',
        id: parsed.account.id,
        roles: normalizeRoles(parsed.account.roles),
        ...(Array.isArray(parsed.account.registeredRoles)
          ? { registeredRoles: normalizeRoles(parsed.account.registeredRoles) }
          : {}),
        avatarUrl: parsed.account.avatarUrl ?? null,
        address: parsed.account.address ?? null,
      },
    };
  } catch {
    if (value === 'fake-session-token') return null;

    // Upgrade the previous fake token-only session without signing the user out.
    return {
      accessToken: value,
      account: {
        displayName: 'Demo User',
        email: 'demo@example.com',
        id: 'demo-account',
        roles: [...ACCOUNT_ROLES],
        avatarUrl: null,
      },
    };
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AppSession | null>(null);
  const sessionRef = useRef<AppSession | null>(session);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    async function loadSession() {
      try {
        const storedSession = await getStorageItemAsync('session');
        const parsed = parseStoredSession(storedSession);
        sessionRef.current = parsed;
        setSession(parsed);
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
        avatarUrl: nextSession.account.avatarUrl ?? null,
      },
    };

    sessionRef.current = normalizedSession;
    await setStorageItemAsync('session', JSON.stringify(normalizedSession));
    setSession(normalizedSession);
  }

  async function logOut() {
    sessionRef.current = null;
    setSession(null);
    await queryClient.cancelQueries();
    queryClient.clear();
    await removeStorageItemAsync('session');
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch {
      // Ignore if native module is not configured or in testing environment
    }
  }

  function mapBackendRoles(roles?: string[]): AccountRole[] {
    if (!Array.isArray(roles)) return [];
    return roles
      .map((r) => backendRoleToAccountRole[r.toUpperCase()])
      .filter((r): r is AccountRole => Boolean(r));
  }

  async function setRoleEnabled(
    role: OptionalAccountRole,
    enabled: boolean,
    options?: SetRoleEnabledOptions,
  ) {
    const activeSession = sessionRef.current ?? session;
    if (!activeSession) return;

    let updatedSession = activeSession;
    try {
      const backendRole = role.toUpperCase();
      const res = await toggleRole(backendRole, enabled, activeSession.accessToken);
      if (res?.accessToken) {
        const nextRoles = normalizeRoles(mapBackendRoles(res.user.roles));
        const nextRegisteredRoles = Array.isArray(res.user.registeredRoles)
          ? normalizeRoles(mapBackendRoles(res.user.registeredRoles))
          : normalizeRoles([
              ...(activeSession.account.registeredRoles ?? activeSession.account.roles),
              ...(enabled ? [role] : []),
            ]);

        updatedSession = {
          ...activeSession,
          accessToken: res.accessToken,
          account: {
            ...activeSession.account,
            roles: nextRoles,
            registeredRoles: nextRegisteredRoles,
          },
        };
      }
    } catch (error) {
      if (options?.throwOnError) {
        throw error;
      }
      // Fallback to local toggle if network unavailable
      const nextRoles = enabled
        ? normalizeRoles([...activeSession.account.roles, role])
        : activeSession.account.roles.filter((accountRole) => accountRole !== role);
      updatedSession = {
        ...activeSession,
        account: {
          ...activeSession.account,
          roles: nextRoles,
        },
      };
    }

    sessionRef.current = updatedSession;
    setSession(updatedSession);
    await setStorageItemAsync('session', JSON.stringify(updatedSession));
  }

  async function updateAccount(updates: Partial<Account>) {
    if (!sessionRef.current) return;
    const current = sessionRef.current;
    const nextSession = {
      ...current,
      account: {
        ...current.account,
        ...updates,
      },
    };
    if (!sessionRef.current) return;
    sessionRef.current = nextSession;
    setSession(nextSession);
    await setStorageItemAsync('session', JSON.stringify(nextSession));
  }

  return (
    <AuthContext.Provider
      value={{ isInitializing, isLoading, logIn, logOut, session, setRoleEnabled, updateAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}
