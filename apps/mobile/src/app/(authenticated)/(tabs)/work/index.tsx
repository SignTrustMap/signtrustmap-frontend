import { WorkScreen } from '@/feature/work/pages/work-screen';
import { useLocalSearchParams } from 'expo-router';

type CurrentRole = 'driver' | 'surveyor' | 'reviewer';

const validRoles: CurrentRole[] = [
  'driver',
  'surveyor',
  'reviewer',
];

export default function WorkRoute() {

  const { currentRole } = useLocalSearchParams<{
    currentRole: CurrentRole
  }>();

  const role: CurrentRole =
    currentRole && validRoles.includes(currentRole) ? currentRole : 'driver';

  return <WorkScreen currentRole={role} />;
}
