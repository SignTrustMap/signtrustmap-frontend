import { Redirect } from 'expo-router';

import { useSession } from '@/context/session-provider';

export default function IndexRoute() {
  const { session } = useSession();

  if (!session?.trim()) {
    return <Redirect href="/(public)/login" />;
  }

  return <Redirect href="/(driver)" />;
}
