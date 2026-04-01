import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import AdminLogoutButton from "@/components/admin-logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gn-primary text-gn-text-inverse">
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="text-sm font-semibold tracking-tight">
              Admin Panel
            </Link>
            <Link
              href="/admin/articles/new"
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              + Artikull i ri
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/50">
              {session.name}
            </span>
            <AdminLogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}
