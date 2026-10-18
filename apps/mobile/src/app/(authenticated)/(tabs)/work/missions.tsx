import { useLocalSearchParams } from 'expo-router';

import { MissionsScreen } from '@/feature/work/pages/missions-screen';
import type { WorkMissionRole } from '@/types/dailyTaskType';

const validRoles: WorkMissionRole[] = ['driver', 'surveyor', 'reviewer'];

export default function MissionsRoute() {
  const { role } = useLocalSearchParams<{ role?: WorkMissionRole }>();
  const initialRole: WorkMissionRole =
    role && validRoles.includes(role) ? role : 'driver';

  return <MissionsScreen initialRole={initialRole} />;
}
