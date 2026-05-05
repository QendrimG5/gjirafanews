import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initialized, authenticated, user } = useAuth();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gn-text-tertiary">
          Duke kontrolluar sesionin...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.roles.includes("admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-sm text-center">
          <div className="text-gn-text mb-2 text-lg font-semibold">
            Nuk keni te drejta administrative
          </div>
          <p className="text-gn-text-tertiary text-sm">
            Llogaria juaj nuk eshte ne rolin "admin". Kontaktoni administratorin.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
