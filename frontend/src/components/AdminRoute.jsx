import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    console.log('[AdminRoute] Loading state...');
    return <div className="loading-spinner" />;
  }

  if (!user) {
    console.log('[AdminRoute] No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    console.log('[AdminRoute] User is not admin, role:', user.role, 'redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('[AdminRoute] Authorized as admin:', user.email);
  return children;
}
