"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { User } from "@/types/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faRemove, faEye, faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight } from "@fortawesome/free-solid-svg-icons";

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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [optionsLoading, setOptionsLoading] = useState(false); // Add loading state

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users", {
        params: { page: currentPage, pageSize, search: searchTerm, orderBy: "id", order: "desc" },
      });
      setUsers(response.data.data);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // Fetch active departments, designations, and roles
  const fetchOptions = async () => {
    setOptionsLoading(true); // Set loading to true
    try {
      console.log("Fetching options...");
      const [departmentsResponse, designationsResponse, rolesResponse] = await Promise.all([
        axiosInstance.get("/departments", { params: { state: "Active" } }),
        axiosInstance.get("/designations", { params: { state: "Active" } }),
        axiosInstance.get("/roles", { params: { state: "Active" } }),
      ]);
      setDepartments(departmentsResponse.data.data);
      setDesignations(designationsResponse.data.data);
      setRoles(rolesResponse.data.data);
      console.log("Departments:", departmentsResponse.data.data);
      console.log("Designations:", designationsResponse.data.data);
      console.log("Roles:", rolesResponse.data.data);
    } catch (error) {
      console.error("Failed to fetch options:", error);
    } finally {
      setOptionsLoading(false); // Set loading to false
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchTerm]);

  useEffect(() => {
    if (isAddFormOpen || isEditFormOpen) {
      fetchOptions();
    }
  }, [isAddFormOpen, isEditFormOpen]);

  // Handle Add User
  const handleAddUser = async (userData: Omit<User, "id">) => {
    try {
      await axiosInstance.post("/users", userData);
      fetchUsers();
      setIsAddFormOpen(false);
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  // Handle Edit User
  const handleEditUser = async (userData: User) => {
    try {
      await axiosInstance.patch(`/users/${userData.id}`, userData);
      fetchUsers();
      setIsEditFormOpen(false);
    } catch (error) {
      console.error("Failed to edit user:", error);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosInstance.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-blue-500 font-extrabold">Users</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search..."
            className="border rounded px-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
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
            <th className="border border-gray-300 px-4 py-2">First Name</th>
            <th className="border border-gray-300 px-4 py-2">Last Name</th>
            <th className="border border-gray-300 px-4 py-2">Username</th>
            <th className="border border-gray-300 px-4 py-2">Email</th>
            <th className="border border-gray-300 px-4 py-2">Telephone</th>
            <th className="border border-gray-300 px-4 py-2">Department</th>
            <th className="border border-gray-300 px-4 py-2">Designation</th>
            <th className="border border-gray-300 px-4 py-2">Role</th>
            <th className="border border-gray-300 px-4 py-2">Status</th>
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
                <td className="border border-gray-300 px-4 py-2">{user.status}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    className="text-blue-500 hover:underline mr-2"
                    onClick={() => {
                      setSelectedUser(user); // Set the selected user
                      setIsViewDialogOpen(true); // Open the View Dialog
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} className="text-blue-500 w-5 h-5" />
                  </button>
                  <button
                    className="text-green-500 hover:underline mr-2"
                    onClick={() => {
                      setSelectedUser(user); // Set the selected user
                      setIsEditFormOpen(true); // Open the Edit Form
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-green-500 w-5 h-5" />
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDeleteUser(user.id!)}
                  >
                    <FontAwesomeIcon icon={faRemove} className="text-red-500 w-5 h-5" />
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
            className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-blue-900 w-6 h-6" />
          </button>
          <button
            className="px-4 py-2 rounded hover:bg-gray-200 transition"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleLeft} className="text-blue-900 w-6 h-6" />
          </button>
        </div>
        <div className="text-gray-700">
          Page {currentPage} of {Math.ceil(totalItems / pageSize)}
        </div>
        <div>
          <select
            className="border rounded px-4 py-2"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            title="Select number of users per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div>
          <button
            className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === Math.ceil(totalItems / pageSize)}
          >
            <FontAwesomeIcon icon={faAngleRight} className="text-blue-900 w-6 h-6" />
          </button>
          <button
            className="px-4 py-2 rounded hover:bg-gray-200 transition"
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

          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 z-10">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddFormOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6">Add User</h2>
            {optionsLoading ? (
              <div className="text-center py-8">Loading options...</div>
            ) : (
              <form
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  setFormErrors({});
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const userData = Object.fromEntries(formData.entries());
                  if (!userData.telephone || (userData.telephone as string).length < 11) {
                    setFormErrors({ telephone: 'Phone number must be at least 11 characters.' });
                    return;
                  }
                  handleAddUser({
                    first_name: userData.first_name as string,
                    last_name: userData.last_name as string,
                    username: userData.username as string,
                    password: userData.password as string,
                    email: userData.email as string,
                    telephone: userData.telephone as string,
                    department_id: parseInt(userData.department_id as string, 10),
                    designation_id: parseInt(userData.designation_id as string, 10),
                    role_id: parseInt(userData.role_id as string, 10),
                    status: userData.status as "Active" | "Inactive",
                  });
                }}
              >
                <div className="grid grid-cols-3 gap-6">
                  <div className="mb-4">
                    <label className="block mb-2">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Enter the user's first name"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      className="border rounded px-4 py-2 w-full"
                      title="Enter the user's last name"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      className="border rounded px-4 py-2 w-full"
                      required
                      autoComplete="username"
                      title="Enter a unique username for the user"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="border rounded px-4 py-2 w-full"
                      required
                      autoComplete="new-password"
                      title="Enter a secure password for the user"
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="border rounded px-4 py-2 w-full"
                      title="Enter the user's email address"
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Telephone</label>
                    <input
                      type="text"
                      name="telephone"
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Enter the user's telephone number"
                      placeholder="Enter telephone"
                    />
                    {formErrors.telephone && (
                      <div className="text-red-600 text-sm mt-1">{formErrors.telephone}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Department</label>
                    <select
                      name="department_id"
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Select the user's department"
                    >
                      <option value="">Select a Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Designation</label>
                    <select
                      name="designation_id"
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Select the user's designation"
                    >
                      <option value="">Select a Designation</option>
                      {designations.map((designation) => (
                        <option key={designation.id} value={designation.id}>
                          {designation.designation}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Role</label>
                    <select
                      name="role_id"
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Select the user's role"
                    >
                      <option value="">Select a Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Status</label>
                    <select
                      name="status"
                      className="border rounded px-4 py-2 w-full"
                      defaultValue="Active"
                      title="Select the user's status"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="reset"
                    className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
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

          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 z-10">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditFormOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6">Edit User</h2>
            {optionsLoading ? (
              <div className="text-center py-8">Loading options...</div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFormErrors({});
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const userData = Object.fromEntries(formData.entries());
                  if (!userData.telephone || (userData.telephone as string).length < 11) {
                    setFormErrors({ telephone: 'Phone number must be at least 11 characters.' });
                    return;
                  }
                  handleEditUser({
                    id: selectedUser.id,
                    first_name: userData.first_name as string,
                    last_name: userData.last_name as string,
                    username: userData.username as string,
                    email: userData.email as string,
                    telephone: userData.telephone as string,
                    department_id: parseInt(userData.department_id as string, 10),
                    designation_id: parseInt(userData.designation_id as string, 10),
                    role_id: parseInt(userData.role_id as string, 10),
                    status: userData.status as "Active" | "Inactive",
                  });
                }}
              >
                <div className="grid grid-cols-3 gap-6">
                  <div className="mb-4">
                    <label className="block mb-2">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      defaultValue={selectedUser.first_name}
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Enter the user's first name"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      defaultValue={selectedUser.last_name || ""}
                      className="border rounded px-4 py-2 w-full"
                      title="Enter the user's last name"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      defaultValue={selectedUser.username}
                      className="border rounded px-4 py-2 w-full"
                      required
                      autoComplete="username"
                      title="Enter a unique username for the user"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={selectedUser.email || ""}
                      className="border rounded px-4 py-2 w-full"
                      title="Enter the user's email address"
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Telephone</label>
                    <input
                      type="text"
                      name="telephone"
                      defaultValue={selectedUser.telephone}
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Enter the user's telephone number"
                      placeholder="Enter telephone"
                    />
                    {formErrors.telephone && (
                      <div className="text-red-600 text-sm mt-1">{formErrors.telephone}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Department</label>
                    <select
                      name="department_id"
                      defaultValue={selectedUser.department_id || ""}
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Select the user's department"
                    >
                      <option value="">Select a Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Designation</label>
                    <select
                      name="designation_id"
                      defaultValue={selectedUser.designation_id || ""}
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Select the user's designation"
                    >
                      <option value="">Select a Designation</option>
                      {designations.map((designation) => (
                        <option key={designation.id} value={designation.id}>
                          {designation.designation}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Role</label>
                    <select
                      name="role_id"
                      defaultValue={selectedUser.role_id || ""}
                      className="border rounded px-4 py-2 w-full"
                      required
                      title="Select the user's role"
                    >
                      <option value="">Select a Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedUser.status || "Active"}
                      className="border rounded px-4 py-2 w-full"
                      title="Select the user's status"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="reset"
                    className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
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
          {/* Modal Background */}
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsViewDialogOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 z-10">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsViewDialogOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6">View User</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="mb-4">
                <label className="block mb-2 font-bold">First Name</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.first_name}</p>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-bold">Last Name</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.last_name || "-"}</p>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-bold">Username</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.username}</p>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-bold">Email</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.email || "-"}</p>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-bold">Telephone</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.telephone}</p>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-bold">Department</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.department || "-"}</p>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-bold">Designation</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.designation || "-"}</p>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-bold">Role</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.role_name}</p>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-bold">Status</label>
                <p className="border rounded px-4 py-2 bg-gray-100">{selectedUser.status}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
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