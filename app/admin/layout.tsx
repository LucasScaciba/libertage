import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold">
                Admin Panel
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/admin/reports"
                  className="text-sm hover:text-blue-600"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/audit-logs"
                  className="text-sm hover:text-blue-600"
                >
                  Audit Logs
                </Link>
              </div>
            </div>
            <Link href="/portal" className="text-sm hover:text-blue-600">
              Back to Portal
            </Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
