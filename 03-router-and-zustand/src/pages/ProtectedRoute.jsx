import { Navigate } from "react-router";
import { useAuthStore } from "../store/AuthStore";

export function ProtectedRoute({ children, route }) {
  const { isLoggedIn } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to={route} replace />;
  }

  return children;
}
