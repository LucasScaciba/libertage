"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/types";

/**
 * Admin Reports Page - List and manage reports
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4
 */
export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/admin/reports?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update report");
      }

      // Refresh reports
      fetchReports();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const unpublishProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to unpublish this profile?")) return;

    try {
      const response = await fetch(`/api/profiles/${profileId}/unpublish`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to unpublish profile");
      }

      alert("Profile unpublished successfully");
      fetchReports();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const suspendUser = async (userId: string) => {
    const reason = prompt("Enter reason for suspension:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to suspend user");
      }

      alert("User suspended successfully");
      fetchReports();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const banUser = async (userId: string) => {
    const reason = prompt("Enter reason for ban:");
    if (!reason) return;

    if (!confirm("Are you sure you want to BAN this user? This is a severe action.")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to ban user");
      }

      alert("User banned successfully");
      fetchReports();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "destructive";
      case "under_review":
        return "default";
      case "resolved":
        return "secondary";
      case "dismissed":
        return "outline";
      default:
        return "default";
    }
  };

  if (error && error.includes("Insufficient permissions")) {
    return (
      <div className="container mx-auto p-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">You do not have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports Management</h1>
        <p className="text-gray-600 mt-2">Review and manage user-submitted reports</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center">
          <label className="font-medium">Filter by status:</label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </Select>
        </div>
      </Card>

      {/* Reports List */}
      {loading ? (
        <Card className="p-6">
          <p>Loading reports...</p>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <p className="text-red-600">Error: {error}</p>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="p-6">
          <p>No reports found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">
                      Report #{report.id.slice(0, 8)}
                    </h3>
                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Reported: {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">Profile:</p>
                  <p className="text-sm">
                    {report.profile?.display_name || "Unknown"} (@
                    {report.profile?.slug || "unknown"})
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Reporter:</p>
                  <p className="text-sm">
                    {report.reporter?.name || "Anonymous"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Reason:</p>
                  <p className="text-sm">{report.reason}</p>
                </div>
                {report.reviewed_by && (
                  <div>
                    <p className="text-sm font-medium">Reviewed by:</p>
                    <p className="text-sm">{report.reviewer?.name || "Unknown"}</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium mb-1">Details:</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{report.details}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Select
                  value={report.status}
                  onChange={(e) => updateReportStatus(report.id, e.target.value)}
                  className="w-48"
                >
                  <option value="new">New</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unpublishProfile(report.profile_id)}
                >
                  Unpublish Profile
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => suspendUser(report.profile?.user_id)}
                >
                  Suspend User
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => banUser(report.profile?.user_id)}
                >
                  Ban User
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
