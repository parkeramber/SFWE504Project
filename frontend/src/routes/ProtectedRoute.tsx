import { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { loadTokens } from "../auth/session";

type Props = {
  children: ReactElement;
};

export default function ProtectedRoute({ children }: Props) {
  const location = useLocation();
  const tokens = loadTokens();

  if (!tokens) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
