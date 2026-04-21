"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useGetMeQuery } from "@/lib/api";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, isLoading, isError } = useGetMeQuery();

  const unauthorized =
    !isLoading && (isError || !data?.user || data.user.role !== "admin");

  useEffect(() => {
    if (unauthorized) {
      router.replace("/login");
    }
  }, [unauthorized, router]);

  if (isLoading || unauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gn-text-tertiary">
          Duke kontrolluar sesionin...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
