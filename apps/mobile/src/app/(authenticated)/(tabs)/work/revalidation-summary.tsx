import { Redirect } from 'expo-router';

export default function RevalidationSummaryRoute() {
  return <Redirect href={{ pathname: '/work', params: { currentRole: 'reviewer' } }} />;
}
