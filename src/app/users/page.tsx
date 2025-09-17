"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";

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

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  evaluator: "Evaluator",
  applicant: "Applicant",
};

const fetchUsers = async (): Promise<UserProps[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return data as UserProps[];
};

const ITEMS_PER_PAGE = 10;

const AdminUsersPage = () => {
  const router = useRouter();

  const [users, setUsers] = useState<UserProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [chickenedOutFilter, setChickenedOutFilter] = useState<
    "all" | "yes" | "no"
  >("all");

  const [sortKey, setSortKey] = useState<keyof UserProps>("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const getUsers = async () => {
      try {
        setIsLoading(true);
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        setError("Failed to fetch users.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    getUsers();
  }, []);

  const processedUsers = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();

    const filtered = users
      .filter((user) => {
        if (!searchTerm) return true;
        return (
          user.full_name.toLowerCase().includes(lowercasedTerm) ||
          user.email.toLowerCase().includes(lowercasedTerm) ||
          user.role.toLowerCase().includes(lowercasedTerm) ||
          user.reg_num.toLowerCase().includes(lowercasedTerm)
        );
      })
      .filter((user) => {
        if (roleFilter === "all") return true;
        return user.role === roleFilter;
      })
      .filter((user) => {
        if (chickenedOutFilter === "all") return true;
        return chickenedOutFilter === "yes"
          ? user.chickened_out
          : !user.chickened_out;
      });

    return [...filtered].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    users,
    searchTerm,
    roleFilter,
    chickenedOutFilter,
    sortKey,
    sortDirection,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, chickenedOutFilter]);

  const totalPages = Math.ceil(processedUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = processedUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key: keyof UserProps) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({
    columnKey,
    title,
  }: {
    columnKey: keyof UserProps;
    title: string;
  }) => (
    <th
      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer"
      onClick={() => handleSort(columnKey)}
    >
      {title} {sortKey === columnKey && (sortDirection === "asc" ? "↑" : "↓")}
    </th>
  );

  if (isLoading) {
    return <p className="text-center mt-10">Loading users...</p>;
  }

  if (error) {
    return <p className="text-center mt-10 text-red-500">{error}</p>;
  }

  return (
    <main className="min-h-screen p-8 bg-gray-950 text-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center">All Users</h1>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-auto md:min-w-[300px] px-3 py-2 border-gray-700 bg-gray-900 rounded-md shadow-sm"
        />
        <div>
          <label className="sr-only">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border-gray-700 bg-gray-900 rounded-md shadow-sm"
          >
            <option value="all">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="sr-only">Chickened Out</label>
          <select
            value={chickenedOutFilter}
            onChange={(e) =>
              setChickenedOutFilter(e.target.value as "all" | "yes" | "no")
            }
            className="px-3 py-2 border-gray-700 bg-gray-900 rounded-md shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="yes">Chickened Out</option>
            <option value="no">Not Chickened Out</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800 shadow-md">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <SortableHeader columnKey="reg_num" title="Reg No" />
              <SortableHeader columnKey="full_name" title="Name" />
              <SortableHeader columnKey="email" title="Email" />
              <SortableHeader columnKey="role" title="Role" />
              <SortableHeader
                columnKey="chickened_out"
                title="Chickened Out?"
              />
            </tr>
          </thead>
          <tbody className="bg-gray-950 divide-y divide-gray-800">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => router.push(`/user/${user.id}`)}
                  className="hover:bg-gray-900 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.reg_num}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ROLE_LABELS[user.role] || user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.chickened_out ? "Yes" : "No"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">
                  No users found for the selected filters.
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
            className="px-4 py-2 text-sm font-medium border border-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium border border-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};

export default AdminUsersPage;
