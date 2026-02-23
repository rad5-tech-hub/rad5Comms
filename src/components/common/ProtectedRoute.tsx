// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  // If no token → redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If token exists → show the child route (HomePage, etc.)
  return <Outlet />;
};

export default ProtectedRoute;