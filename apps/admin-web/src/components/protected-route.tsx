import { Navigate } from "react-router-dom";
import { useGetMeQuery } from "@/lib/api";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading, isError } = useGetMeQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gn-text-tertiary">
          Duke kontrolluar sesionin...
        </div>
      </div>
    );
  }

  if (isError || !data?.user || data.user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
