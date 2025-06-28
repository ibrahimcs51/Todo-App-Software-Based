// src/components/ProtectedRoute.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-10 text-lg">Checking authentication...</div>; // Or a spinner
  }

  return user ? children : <Navigate to="/auth" />;
};

export default ProtectedRoute;

