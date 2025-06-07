"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faRemove,
  faEye,
  faAngleDoubleLeft,
  faAngleLeft,
  faAngleRight,
  faAngleDoubleRight,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Types
interface Role {
  id: number;
  name: string;
}
interface RolesClientProps {
  user: any;
  permissions: string[];
}

// Zod schema
const roleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
});
type RoleForm = z.infer<typeof roleSchema>;

export default function RolesClient({ user, permissions }: RolesClientProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Add Role Form
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "" },
  });

  // Edit Role Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  });

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/roles", {
        params: {
          page: currentPage,
          pageSize,
          search: searchTerm,
          sortColumn: sortColumn || "id",
          sortOrder: sortOrder || "desc",
        },
      });
      setRoles(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      console.error("Failed to fetch roles:", error);
      toast.error(error?.response?.data?.error || "Failed to fetch roles");
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchTerm, sortColumn, sortOrder]);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-400" />;
    }
    return sortOrder === "asc"
      ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-blue-600" />
      : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-blue-600" />;
  };

  // Handle Add Role
  const onAddRole = async (data: RoleForm) => {
    try {
      await axiosInstance.post("/roles", data);
      setIsAddFormOpen(false);
      resetAdd({ name: "" });
      toast.success("Role added successfully!");
      setCurrentPage(1);
      setSortColumn("id");
      setSortOrder("desc");
      fetchRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to add role.");
    }
  };

  // Handle Edit Role
  const onEditRole = async (data: RoleForm) => {
    try {
      if (!selectedRole) return;
      await axiosInstance.patch(`/roles/${selectedRole.id}`, data);
      setIsEditFormOpen(false);
      setSelectedRole(null);
      toast.success("Role updated successfully!");
      fetchRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update role.");
    }
  };

  // Handle Delete Role
  const handleDeleteRole = async (id: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      try {
        await axiosInstance.delete(`/roles/${id}`);
        toast.success("Role deleted.");
        fetchRoles();
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to delete role.");
      }
    }
  };

  // Open Edit Form
  const openEditForm = (role: Role) => {
    setSelectedRole(role);
    resetEdit({ name: role.name });
    setIsEditFormOpen(true);
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-blue-500 font-extrabold">Roles</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search roles..."
            className="border rounded px-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={() => setIsAddFormOpen(true)}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("name")}
            >
              Role Name {getSortIcon("name")}
            </th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.length > 0 ? (
            roles.map((role) => (
              <tr
                key={role.id}
                className="odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              >
                <td className="border border-gray-300 px-4 py-2">{role.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-left">
                  <button
                    className="text-blue-500 hover:underline mr-2"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsViewDialogOpen(true);
                    }}
                    title="View"
                  >
                    <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                  </button>
                  <button
                    className="text-green-500 hover:underline mr-2"
                    onClick={() => openEditForm(role)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDeleteRole(role.id)}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faRemove} className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="text-center py-4">
                No roles found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <button
            className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-blue-900 w-6 h-6" />
          </button>
          <button
            className="px-4 py-2 rounded hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleLeft} className="text-blue-900 w-6 h-6" />
          </button>
        </div>
        <div className="text-gray-700 flex items-center space-x-2">
          <span>
            Page {currentPage} of {Math.ceil(totalItems / pageSize)}
          </span>
          <select
            className="border rounded px-4 py-2 shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div>
          <button
            className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === Math.ceil(totalItems / pageSize)}
          >
            <FontAwesomeIcon icon={faAngleRight} className="text-blue-900 w-6 h-6" />
          </button>
          <button
            className="px-4 py-2 rounded hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
            onClick={() => setCurrentPage(Math.ceil(totalItems / pageSize))}
            disabled={currentPage === Math.ceil(totalItems / pageSize)}
          >
            <FontAwesomeIcon icon={faAngleDoubleRight} className="text-blue-900 w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Add Role Form */}
      {isAddFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsAddFormOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-1/2 z-10">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddFormOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Add Role</h2>
            <form onSubmit={handleSubmitAdd(onAddRole)}>
              <div className="mb-4">
                <label className="block mb-2">Role Name</label>
                <input
                  type="text"
                  {...registerAdd("name")}
                  className={`border rounded px-4 py-2 w-full ${errorsAdd.name ? "border-red-500" : ""}`}
                  placeholder="Enter role name"
                />
                {errorsAdd.name && (
                  <p className="text-red-600 text-sm mt-1">{errorsAdd.name.message}</p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={() => resetAdd({ name: "" })}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  disabled={isSubmittingAdd}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Form */}
      {isEditFormOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsEditFormOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-1/2 z-10">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditFormOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Edit Role</h2>
            <form onSubmit={handleSubmitEdit(onEditRole)}>
              <div className="mb-4">
                <label className="block mb-2">Role Name</label>
                <input
                  type="text"
                  {...registerEdit("name")}
                  className={`border rounded px-4 py-2 w-full ${errorsEdit.name ? "border-red-500" : ""}`}
                  placeholder="Enter role name"
                />
                {errorsEdit.name && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.name.message}</p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={() => setIsEditFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  disabled={isSubmittingEdit}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Role Dialog */}
      {isViewDialogOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsViewDialogOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-1/2 z-10">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsViewDialogOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6">Role Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name</label>
                <p className="text-gray-900">{selectedRole.name}</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}