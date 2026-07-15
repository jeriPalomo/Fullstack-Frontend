import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Route guard: redirects to /login if nobody is signed in, or to / if the
// route needs admin rights the current customer doesn't have.
export function ProtectedRoute({ requireAdmin = false, children }) {
  const { customer } = useAuth();

  if (!customer) return <Navigate to="/login" replace />;
  if (requireAdmin && !customer.admin) return <Navigate to="/" replace />;

  return children;
}
