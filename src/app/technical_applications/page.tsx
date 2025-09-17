"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../utils/supabase/client";
import { useRouter } from "next/navigation";

interface ApplicationProps {
  id: string;
  user_id: string;
  department: string;
  submitted: boolean;
  created_at: string;
  updated_at: string;
  status: string;
  username?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  under_review: "Under Review",
  waitlisted: "Waitlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const fetchApplicationsWithUsers = async (): Promise<ApplicationProps[]> => {
  const supabase = createClient();

  const { data: applications, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("department", "technical");
  if (appError) throw appError;

  if (!applications || applications.length === 0) return [];

  const userIds = [...new Set(applications.map((a) => a.user_id))];
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", userIds);
  if (userError) throw userError;

  const userMap = new Map(users.map((u) => [u.id, u.full_name]));

  return applications.map((app) => ({
    ...app,
    username: userMap.get(app.user_id) || "Unknown User",
  }));
};

const PAGE_SIZE = 10;

const TechnicalApplicationsPage = () => {
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submittedFilter, setSubmittedFilter] = useState<"all" | "yes" | "no">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const getApplications = async () => {
      try {
        setIsLoading(true);
        const data = await fetchApplicationsWithUsers();
        setApplications(data);
      } catch (err) {
        setError("Failed to fetch applications.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    getApplications();
  }, []);

  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        if (submittedFilter === "all") return true;
        return submittedFilter === "yes" ? app.submitted : !app.submitted;
      })
      .filter((app) => {
        if (statusFilter === "all") return true;
        return app.status === statusFilter;
      });
  }, [applications, submittedFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [submittedFilter, statusFilter]);

  const totalPages = Math.ceil(filteredApps.length / PAGE_SIZE);
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (isLoading) {
    return <p className="text-center mt-10">Loading applications...</p>;
  }

  if (error) {
    return <p className="text-center mt-10 text-red-500">{error}</p>;
  }

  return (
    <main className="min-h-screen p-8 bg-gray-950 text-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Technical Applications
      </h1>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        <div>
          <label className="sr-only">Submission Status</label>
          <select
            value={submittedFilter}
            onChange={(e) =>
              setSubmittedFilter(e.target.value as "all" | "yes" | "no")
            }
            className="px-3 py-2 border border-gray-800 bg-gray-950 rounded-md shadow-sm"
          >
            <option value="all">All Submissions</option>
            <option value="yes">Submitted</option>
            <option value="no">Not Submitted</option>
          </select>
        </div>
        <div>
          <label className="sr-only">Application Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-800 bg-gray-950 rounded-md shadow-sm"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800 shadow-md">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-950 divide-y divide-gray-800">
            {paginatedApps.length > 0 ? (
              paginatedApps.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => router.push(`/application/${app.id}`)}
                  className="hover:bg-gray-900 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {app.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {app.submitted ? "Yes" : "No"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {STATUS_LABELS[app.status] || app.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-10 text-gray-500">
                  No applications found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium border border-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium border border-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};

export default TechnicalApplicationsPage;
