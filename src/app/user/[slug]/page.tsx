"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

interface UserProps {
  id: string;
  full_name: string;
  email: string;
  verified: boolean;
  phone_number: string;
  role: string;
  chickened_out: boolean;
  created_at: string;
  updated_at: string;
  reg_num: string;
}

interface ApplicationProps {
  id: string;
  department: string;
  submitted: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  evaluator: "Evaluator",
  applicant: "Applicant",
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  under_review: "Under Review",
  waitlisted: "Waitlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  technical: "Technical",
  social_media: "Social Media",
  design: "Design",
  management: "Management",
};

const fetchUser = async (id: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as UserProps;
};

const fetchApplications = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ApplicationProps[];
};

const UserDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [user, setUser] = useState<UserProps | null>(null);
  const [applications, setApplications] = useState<ApplicationProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      setError("User ID is missing.");
      return;
    }

    const getData = async () => {
      try {
        setIsLoading(true);
        const [userData, appsData] = await Promise.all([
          fetchUser(slug),
          fetchApplications(slug),
        ]);
        setUser(userData);
        setApplications(appsData);
      } catch (err) {
        setError("Failed to fetch user data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getData();
  }, [slug]);

  const DetailItem = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  );

  if (isLoading) {
    return (
      <p className="text-center mt-10 text-gray-400">Loading user details...</p>
    );
  }

  if (error) {
    return <p className="text-center mt-10 text-red-500">{error}</p>;
  }

  if (!user) {
    return <p className="text-center mt-10 text-gray-500">User not found.</p>;
  }

  return (
    <main className="min-h-screen p-8 bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm hover:underline text-gray-400"
        >
          &larr; Back to All Users
        </button>

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4">{user.full_name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DetailItem label="Reg No" value={user.reg_num} />
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Phone" value={user.phone_number} />
            <DetailItem
              label="Role"
              value={ROLE_LABELS[user.role] || user.role}
            />
            <DetailItem label="Verified" value={user.verified ? "Yes" : "No"} />
            <DetailItem
              label="Chickened Out"
              value={user.chickened_out ? "Yes" : "No"}
            />
            <DetailItem
              label="Created At"
              value={new Date(user.created_at).toLocaleString()}
            />
            <DetailItem
              label="Updated At"
              value={new Date(user.updated_at).toLocaleString()}
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Applications</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-800 shadow-md">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Updated At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-950 divide-y divide-gray-800">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => router.push(`/application/${app.id}`)}
                      className="hover:bg-gray-900 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {DEPARTMENT_LABELS[app.department] || app.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {app.submitted ? "Yes" : "No"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {STATUS_LABELS[app.status] || app.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(app.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(app.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      No applications found for this user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UserDetailPage;
