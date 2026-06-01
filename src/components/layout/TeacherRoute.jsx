import { Navigate, Outlet } from 'react-router-dom';
import { useTeacherSession } from './TeacherSessionProvider.jsx';

export function TeacherRoute() {
  const { isTeacher } = useTeacherSession();

  if (!isTeacher) {
    return <Navigate to="/teacher" replace />;
  }

  return <Outlet />;
}
