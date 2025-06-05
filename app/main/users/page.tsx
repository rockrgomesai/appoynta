"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { User } from "@/types/User";
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
  faSortDown
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema for user validation
const userSchema = z.object({
  first_name: z.string().min(2, "First name is required").max(50, "First name too long"),
  last_name: z.string().max(50, "Last name too long").optional().or(z.literal("")),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  telephone: z.string().min(11, "Phone number must be at least 11 characters").max(15, "Phone number too long"),
  department_id: z.string().min(1, "Please select a department"),
  designation_id: z.string().min(1, "Please select a designation"),
  role_id: z.string().min(1, "Please select a role"),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required" }),
});

const userAddSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const userEditSchema = userSchema.omit({ password: true });

type UserAddForm = z.infer<typeof userAddSchema>;
type UserEditForm = z.infer<typeof userEditSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{ id: number; department: string }[]>([]);
  const [designations, setDesignations] = useState<{ id: number; designation: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Add User Form
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm<UserAddForm>({
    resolver: zodResolver(userAddSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      password: "",
      email: "",
      telephone: "",
      department_id: "",
      designation_id: "",
      role_id: "",
      status: "Active",
    },
  });

  // Edit User Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      telephone: "",
      department_id: "",
      designation_id: "",
      role_id: "",
      status: "Active",
    } as any, // Type assertion to allow string defaults for select fields
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users", {
        params: { 
          page: currentPage, 
          pageSize, 
          search: searchTerm, 
          sortColumn: sortColumn || "id", 
          sortOrder: sortOrder || "desc" 
        },
      });
      setUsers(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error(error?.response?.data?.error || "Failed to fetch users");
    }
  };

  // Fetch active departments, designations, and roles
  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const [departmentsResponse, designationsResponse, rolesResponse] = await Promise.all([
        axiosInstance.get("/departments", { params: { status: "Active" } }),
        axiosInstance.get("/designations", { params: { status: "Active" } }),
        axiosInstance.get("/roles", { params: { status: "Active" } }),
      ]);
      setDepartments(departmentsResponse.data.data || []);
      setDesignations(designationsResponse.data.data || []);
      setRoles(rolesResponse.data.data || []);
    } catch (error) {
      console.error("Failed to fetch options:", error);
      toast.error("Failed to fetch form options");
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchTerm, sortColumn, sortOrder]);

  useEffect(() => {
    if (isAddFormOpen || isEditFormOpen) {
      fetchOptions();
    }
  }, [isAddFormOpen, isEditFormOpen]);

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

  // Handle Add User
  const onAddUser = async (data: UserAddForm) => {
    try {
      // Convert string IDs to numbers before sending to backend
      const payload = {
        ...data,
        department_id: parseInt(data.department_id, 10),
        designation_id: parseInt(data.designation_id, 10),
        role_id: parseInt(data.role_id, 10),
      };
      await axiosInstance.post("/users", payload);
      setIsAddFormOpen(false);
      resetAdd({
        first_name: "",
        last_name: "",
        username: "",
        password: "",
        email: "",
        telephone: "",
        department_id: "",
        designation_id: "",
        role_id: "",
        status: "Active",
      });
      toast.success("User added successfully!");
      
      // Reset to first page and ensure proper sorting for new records
      setCurrentPage(1);
      setSortColumn("id");
      setSortOrder("desc");
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to add user.");
    }
  };

  // Handle Edit User
  const onEditUser = async (data: UserEditForm) => {
    try {
      if (!selectedUser) return;
      const payload = {
        ...data,
        department_id: parseInt(data.department_id, 10),
        designation_id: parseInt(data.designation_id, 10),
        role_id: parseInt(data.role_id, 10),
      };
      await axiosInstance.patch(`/users/${selectedUser.id}`, payload);
      setIsEditFormOpen(false);
      setSelectedUser(null);
      toast.success("User updated successfully!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update user.");
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: number) => {
    try {
      await axiosInstance.delete(`/users/${userId}`);
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete user.");
    }
  };

  // Open Edit Form
  const openEditForm = (user: User) => {
    setSelectedUser(user);
    resetEdit({
      first_name: user.first_name,
      last_name: user.last_name || "",
      username: user.username,
      email: user.email || "",
      telephone: user.telephone,
      department_id: user.department_id ? String(user.department_id) : "",
      designation_id: user.designation_id ? String(user.designation_id) : "",
      role_id: user.role_id ? String(user.role_id) : "",
      status: user.status as "Active" | "Inactive",
    });
    setIsEditFormOpen(true);
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-blue-500 font-extrabold">Users</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search users..."
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

      {/* Users Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("first_name")}
            >
              First Name {getSortIcon("first_name")}
            </th>
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("last_name")}
            >
              Last Name {getSortIcon("last_name")}
            </th>
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("username")}
            >
              Username {getSortIcon("username")}
            </th>
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("email")}
            >
              Email {getSortIcon("email")}
            </th>
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("telephone")}
            >
              Telephone {getSortIcon("telephone")}
            </th>
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("department")}
            >
              Department {getSortIcon("department")}
            </th>
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("designation")}
            >
              Designation {getSortIcon("designation")}
            </th>
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("role_name")}
            >
              Role {getSortIcon("role_name")}
            </th>
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("status")}
            >
              Status {getSortIcon("status")}
            </th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr
                key={user.id}
                className="odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              >
                <td className="border border-gray-300 px-4 py-2">{user.first_name}</td>
                <td className="border border-gray-300 px-4 py-2">{user.last_name || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">{user.username}</td>
                <td className="border border-gray-300 px-4 py-2">{user.email || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">{user.telephone}</td>
                <td className="border border-gray-300 px-4 py-2">{user.department || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">{user.designation || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">{user.role_name}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <span className="px-2 py-1 rounded text-sm">
                    {user.status}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-left">
                  <button
                    className="text-blue-500 hover:underline mr-2"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsViewDialogOpen(true);
                    }}
                    title="View"
                  >
                    <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                  </button>
                  <button
                    className="text-green-500 hover:underline mr-2"
                    onClick={() => openEditForm(user)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDeleteUser(user.id!)}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faRemove} className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="text-center py-4">
                No users found.
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

      {/* Add User Form */}
      {isAddFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsAddFormOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 max-w-6xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddFormOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Add User</h2>
            {optionsLoading ? (
              <div className="text-center py-8">Loading options...</div>
            ) : (
              <form onSubmit={handleSubmitAdd(onAddUser)}>
                <div className="grid grid-cols-3 gap-6">
                  <div className="mb-4">
                    <label className="block mb-2">First Name</label>
                    <input
                      type="text"
                      {...registerAdd("first_name")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.first_name ? "border-red-500" : ""}`}
                      placeholder="Enter first name"
                    />
                    {errorsAdd.first_name && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.first_name.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Last Name</label>
                    <input
                      type="text"
                      {...registerAdd("last_name")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.last_name ? "border-red-500" : ""}`}
                      placeholder="Enter last name"
                    />
                    {errorsAdd.last_name && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.last_name.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Username</label>
                    <input
                      type="text"
                      {...registerAdd("username")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.username ? "border-red-500" : ""}`}
                      placeholder="Enter username"
                      autoComplete="username"
                    />
                    {errorsAdd.username && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.username.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Password</label>
                    <input
                      type="password"
                      {...registerAdd("password")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.password ? "border-red-500" : ""}`}
                      placeholder="Enter password"
                      autoComplete="new-password"
                    />
                    {errorsAdd.password && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.password.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Email</label>
                    <input
                      type="email"
                      {...registerAdd("email")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.email ? "border-red-500" : ""}`}
                      placeholder="Enter email"
                    />
                    {errorsAdd.email && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.email.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Telephone</label>
                    <input
                      type="text"
                      {...registerAdd("telephone")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.telephone ? "border-red-500" : ""}`}
                      placeholder="Enter telephone"
                    />
                    {errorsAdd.telephone && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.telephone.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Department</label>
                    <select
                      {...registerAdd("department_id")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.department_id ? "border-red-500" : ""}`}
                    >
                      <option value="">Select a Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id.toString()}>{department.department}</option>
                      ))}
                    </select>
                    {errorsAdd.department_id && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.department_id.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Designation</label>
                    <select
                      {...registerAdd("designation_id")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.designation_id ? "border-red-500" : ""}`}
                    >
                      <option value="">Select a Designation</option>
                      {designations.map((designation) => (
                        <option key={designation.id} value={designation.id.toString()}>
                          {designation.designation}
                        </option>
                      ))}
                    </select>
                    {errorsAdd.designation_id && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.designation_id.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Role</label>
                    <select
                      {...registerAdd("role_id")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.role_id ? "border-red-500" : ""}`}
                    >
                      <option value="">Select a Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id.toString()}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {errorsAdd.role_id && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.role_id.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Status</label>
                    <select
                      {...registerAdd("status")}
                      className={`border rounded px-4 py-2 w-full ${errorsAdd.status ? "border-red-500" : ""}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    {errorsAdd.status && (
                      <p className="text-red-600 text-sm mt-1">{errorsAdd.status.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                    onClick={() => resetAdd()}
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
            )}
          </div>
        </div>
      )}

      {/* Edit User Form */}
      {isEditFormOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsEditFormOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 max-w-6xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditFormOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Edit User</h2>
            {optionsLoading ? (
              <div className="text-center py-8">Loading options...</div>
            ) : (
              <form onSubmit={handleSubmitEdit(onEditUser)}>
                <div className="grid grid-cols-3 gap-6">
                  <div className="mb-4">
                    <label className="block mb-2">First Name</label>
                    <input
                      type="text"
                      {...registerEdit("first_name")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.first_name ? "border-red-500" : ""}`}
                      placeholder="Enter first name"
                    />
                    {errorsEdit.first_name && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.first_name.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Last Name</label>
                    <input
                      type="text"
                      {...registerEdit("last_name")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.last_name ? "border-red-500" : ""}`}
                      placeholder="Enter last name"
                    />
                    {errorsEdit.last_name && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.last_name.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Username</label>
                    <input
                      type="text"
                      {...registerEdit("username")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.username ? "border-red-500" : ""}`}
                      placeholder="Enter username"
                      autoComplete="username"
                    />
                    {errorsEdit.username && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.username.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Email</label>
                    <input
                      type="email"
                      {...registerEdit("email")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.email ? "border-red-500" : ""}`}
                      placeholder="Enter email"
                    />
                    {errorsEdit.email && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.email.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Telephone</label>
                    <input
                      type="text"
                      {...registerEdit("telephone")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.telephone ? "border-red-500" : ""}`}
                      placeholder="Enter telephone"
                    />
                    {errorsEdit.telephone && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.telephone.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Department</label>
                    <select
                      {...registerEdit("department_id")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.department_id ? "border-red-500" : ""}`}
                    >
                      <option value="">Select a Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id.toString()}>
                          {department.department}
                        </option>
                      ))}
                    </select>
                    {errorsEdit.department_id && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.department_id.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Designation</label>
                    <select
                      {...registerEdit("designation_id")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.designation_id ? "border-red-500" : ""}`}
                    >
                      <option value="">Select a Designation</option>
                      {designations.map((designation) => (
                        <option key={designation.id} value={designation.id.toString()}>
                          {designation.designation}
                        </option>
                      ))}
                    </select>
                    {errorsEdit.designation_id && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.designation_id.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Role</label>
                    <select
                      {...registerEdit("role_id")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.role_id ? "border-red-500" : ""}`}
                    >
                      <option value="">Select a Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id.toString()}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {errorsEdit.role_id && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.role_id.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Status</label>
                    <select
                      {...registerEdit("status")}
                      className={`border rounded px-4 py-2 w-full ${errorsEdit.status ? "border-red-500" : ""}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    {errorsEdit.status && (
                      <p className="text-red-600 text-sm mt-1">{errorsEdit.status.message}</p>
                    )}
                  </div>
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
            )}
          </div>
        </div>
      )}

      {/* View User Dialog */}
      {isViewDialogOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsViewDialogOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 max-w-6xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsViewDialogOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6">User Details</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <p className="text-gray-900">{selectedUser.first_name}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <p className="text-gray-900">{selectedUser.last_name || "-"}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="text-gray-900">{selectedUser.username}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedUser.email || "-"}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Telephone</label>
                <p className="text-gray-900">{selectedUser.telephone}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="text-gray-900">{selectedUser.department || "-"}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <p className="text-gray-900">{selectedUser.designation || "-"}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="text-gray-900">{selectedUser.role_name}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900">{selectedUser.status}</p>
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