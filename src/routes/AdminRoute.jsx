import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/common/LoadingScreen';

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return children;
}
