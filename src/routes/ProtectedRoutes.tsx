import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../hooks/UseAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default ProtectedRoute;
