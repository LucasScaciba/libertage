"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@/types";

/**
 * Admin Audit Logs Page - View system audit trail
 * Validates: Requirements 20.5, 20.6
 */
export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.append("action", actionFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch audit logs");
      }

      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "user_banned":
        return "destructive";
      case "user_suspended":
        return "destructive";
      case "profile_unpublished":
        return "outline";
      case "report_status_updated":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-gray-600 mt-2">
          View all administrative actions performed in the system
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Action Type</Label>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="mt-1"
            >
              <option value="">All Actions</option>
              <option value="profile_unpublished">Profile Unpublished</option>
              <option value="user_suspended">User Suspended</option>
              <option value="user_banned">User Banned</option>
              <option value="report_status_updated">Report Status Updated</option>
            </Select>
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Audit Logs List */}
      {loading ? (
        <Card className="p-6">
          <p>Loading audit logs...</p>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <p className="text-red-600">Error: {error}</p>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="p-6">
          <p>No audit logs found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {formatAction(log.action)}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Actor:</span>{" "}
                      {log.actor?.name || "Unknown"} ({log.actor?.email || "N/A"})
                    </div>
                    <div>
                      <span className="font-medium">Target:</span>{" "}
                      {log.target_type} (ID: {log.target_id.slice(0, 8)}...)
                    </div>
                  </div>

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Metadata:</span>
                      <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {logs.length} audit log entries (max 100)
        </div>
      )}
    </div>
  );
}
