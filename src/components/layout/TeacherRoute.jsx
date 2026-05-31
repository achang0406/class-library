import { Navigate, Outlet } from 'react-router-dom';
import { isTeacherLoggedIn } from '../../lib/teacherSession.js';

export function TeacherRoute() {
  if (!isTeacherLoggedIn()) {
    return <Navigate to="/teacher" replace />;
  }
  return <Outlet />;
}
