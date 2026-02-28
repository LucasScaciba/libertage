import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/reports">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Reports Management</h2>
            <p className="text-gray-600">
              Review and manage user-submitted reports. Update report status and
              take moderation actions.
            </p>
          </Card>
        </Link>

        <Link href="/admin/audit-logs">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Audit Logs</h2>
            <p className="text-gray-600">
              View all administrative actions performed in the system with
              detailed metadata.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
