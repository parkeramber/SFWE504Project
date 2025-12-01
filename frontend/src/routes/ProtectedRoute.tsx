// frontend/src/routes/ProtectedRoute.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { loadTokens } from "../auth/session";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const location = useLocation();
  const tokens = loadTokens();
  const isOnboarding = location.pathname === "/applicant/onboarding";
  const needsProfile = Boolean(tokens?.needsProfileSetup);

  if (!tokens) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (needsProfile && !isOnboarding) {
    return (
      <Navigate
        to="/applicant/onboarding"
        replace
        state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
}
