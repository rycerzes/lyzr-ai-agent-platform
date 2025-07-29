import { requireAdmin } from "@/lib/admin-middleware";
import { AdminDashboard } from "@/components/admin-dashboard";
import { Navigation } from "@/components/navigation";

export default async function AdminPage() {
  const session = await requireAdmin();

  return (
    <>
      <Navigation user={session.user} />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          <AdminDashboard />
        </div>
      </div>
    </>
  );
}
