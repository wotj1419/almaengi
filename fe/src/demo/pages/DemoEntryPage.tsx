import { Navigate, useParams } from 'react-router-dom';
import { isDemoMode } from '../config';
import { DEMO_AUTH_TOKEN, createDemoSession, parseDemoRole } from '../session';
import useAuthStore from '@/stores/useAuthStore';

export default function DemoEntryPage() {
  const { role: roleParam } = useParams();
  const demoRole = parseDemoRole(roleParam);

  if (!isDemoMode()) {
    return <Navigate replace to="/login" />;
  }

  if (!demoRole) {
    return <Navigate replace to="/demo/owner" />;
  }

  const session = createDemoSession(demoRole);
  useAuthStore
    .getState()
    .login(session.user, DEMO_AUTH_TOKEN, session.activeStoreId);

  return <Navigate replace to="/home" />;
}
