import { getStorageItemAsync, removeStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

const AuthContext = createContext<{
  logIn: (session: string) => Promise<void>;
  logOut: () => Promise<void>;
  session: string | null;
  loading: boolean;
} | null>(null);

export const useSession = () => {
  const value = use(AuthContext);

  if (!value) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return value;
};

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const storedSession = await getStorageItemAsync('session');
        setSession(storedSession);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  async function logIn(nextSession: string) {
    await setStorageItemAsync('session', nextSession);
    setSession(nextSession);
  }

  async function logOut() {
    await removeStorageItemAsync('session');
    setSession(null);
  }

  return <AuthContext.Provider
    value={{
      logIn,
      logOut,
      session,
      loading
    }}>{children}</AuthContext.Provider>;
}
