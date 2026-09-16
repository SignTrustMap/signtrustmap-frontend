import { Redirect } from 'expo-router';

import { useSession } from '@/context/session-provider';

export default function IndexRoute() {
  const { isInitializing, session } = useSession();

  if (isInitializing) {
    return null;
  }

  if (!session?.accessToken) {
    return <Redirect href="/(public)/login" />;
  }

  return <Redirect href="/home" />;
}
