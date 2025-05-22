"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Department } from "@/types/Department"; // Import the Department type
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faRemove, faEye, faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get("/departments", {
        params: { page: currentPage, pageSize, search: searchTerm },
      });
      setDepartments(response.data.data);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [currentPage, pageSize, searchTerm]);

  // Handle Add Department
  const handleAddDepartment = async (departmentData: Omit<Department, "id">) => {
    try {
      const response = await axiosInstance.post("/departments", departmentData);
      setDepartments((prev) => [...prev, response.data]);
      setIsAddFormOpen(false);
      toast.success("Department added successfully!");
    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const detail = error?.response?.data?.detail;
      const message = error?.response?.data?.message;
      const errorText = error?.response?.data?.error;
      if (status === 409) {
        toast.error("Department with this name already exists");
      } else if (code && detail) {
        toast.error(`Error ${code}: ${detail}`);
      } else if (detail) {
        toast.error(detail);
      } else if (message) {
        toast.error(message);
      } else if (errorText) {
        toast.error(errorText);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add department.");
      }
      console.error("Failed to add department:", error);
    }
  };

  // Handle Edit Department
  const handleEditDepartment = async (departmentData: Department) => {
    try {
      const response = await axiosInstance.patch(`/departments/${departmentData.id}`, departmentData);
      setDepartments((prev) =>
        prev.map((dept) => (dept.id === response.data.id ? response.data : dept))
      );
      setIsEditFormOpen(false);
      toast.success("Department updated successfully!");
    } catch (error: any) {
      const code = error?.response?.data?.code;
      const detail = error?.response?.data?.detail;
      const message = error?.response?.data?.message;
      if (code && detail) {
        toast.error(`Error ${code}: ${detail}`);
      } else if (detail) {
        toast.error(detail);
      } else if (message) {
        toast.error(message);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update department.");
      }
      console.error("Failed to edit department:", error);
    }
  };

  // Handle Delete Department
  const handleDeleteDepartment = async (id: number) => {
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        await axiosInstance.delete(`/departments/${id}`);
        setDepartments((prev) => prev.filter((dept) => dept.id !== id));
      } catch (error) {
        console.error("Failed to delete department:", error);
      }
    }
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-blue-500 font-extrabold">Departments</h1>
        <div className="flex items-center space-x-4">
          <label htmlFor="search-input" className="sr-only">Search Departments</label>
          <input
            id="search-input"
            type="text"
            placeholder="Search departments..."
            title="Search Departments"
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

      {/* Departments Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="border border-gray-300 px-4 py-2">Department</th>
            <th className="border border-gray-300 px-4 py-2">Status</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.length > 0 ? (
            departments.map((department) => (
              <tr
                key={department.id}
                className="odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              >
                <td className="border border-gray-300 px-4 py-2">{department.department}</td>
                <td className="border border-gray-300 px-4 py-2">{department.status}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    className="text-blue-500 hover:underline mr-2"
                    onClick={() => {
                      setSelectedDepartment(department);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} className="text-blue-500 w-5 h-5" />
                  </button>
                  <button
                    className="text-green-500 hover:underline mr-2"
                    onClick={() => {
                      setSelectedDepartment(department);
                      setIsEditFormOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-green-500 w-5 h-5" />
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDeleteDepartment(department.id!)}
                  >
                    <FontAwesomeIcon icon={faRemove} className="text-red-500 w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center py-4">
                No departments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        {/* First and Previous Buttons */}
        <div>
          <button
            className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition shadow-md"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-blue-900 w-6 h-6" />
          </button>
          <button
            className="px-4 py-2 rounded hover:bg-gray-200 transition shadow-md"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleLeft} className="text-blue-900 w-6 h-6" />
          </button>
        </div>

        {/* Page Display */}
        <div className="text-gray-700 flex items-center space-x-2">
          <span>
            Page {currentPage} of {Math.ceil(totalItems / pageSize)}
          </span>
          <label htmlFor="page-size-select" className="sr-only">Page Size</label>
          <select
            id="page-size-select"
            className="border rounded px-4 py-2 shadow-md"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            title="Page Size"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Next and Last Buttons */}
        <div>
          <button
            className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition shadow-md"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === Math.ceil(totalItems / pageSize)}
          >
            <FontAwesomeIcon icon={faAngleRight} className="text-blue-900 w-6 h-6" />
          </button>
          <button
            className="px-4 py-2 rounded hover:bg-gray-200 transition shadow-md"
            onClick={() => setCurrentPage(Math.ceil(totalItems / pageSize))}
            disabled={currentPage === Math.ceil(totalItems / pageSize)}
          >
            <FontAwesomeIcon icon={faAngleDoubleRight} className="text-blue-900 w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Add Department Form */}
      {isAddFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Modal Background */}
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsAddFormOpen(false)} // Close the modal when clicking outside
          ></div>

          {/* Modal Content */}
          <div className="relative bg-teal-50 p-8 rounded shadow-lg w-1/2 z-10">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddFormOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6">Add Department</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const departmentData = Object.fromEntries(formData.entries());
                handleAddDepartment({
                  department: departmentData.department as string,
                  status: departmentData.status as "Active" | "Inactive",
                });
              }}
            >
              <div className="mb-4">
                <label className="block mb-2">Department Name</label>
                <input
                  type="text"
                  name="department"
                  className="border rounded px-4 py-2 w-full"
                  required
                  placeholder="Enter department name"
                  title="Department Name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Status</label>
                <select
                  name="status"
                  className="border rounded px-4 py-2 w-full"
                  defaultValue="Active"
                  title="Department Status"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
          </div>
        </div>
      )}

      {/* Edit Department Form */}
      {isEditFormOpen && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Modal Background */}
          <div
            className="absolute inset-0  bg-gray-500/50"
            onClick={() => setIsEditFormOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white p-8 rounded shadow-lg w-1/2 z-10">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditFormOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6">Edit Department</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const departmentData = Object.fromEntries(formData.entries());
                handleEditDepartment({
                  id: selectedDepartment.id,
                  department: departmentData.department as string,
                  status: departmentData.status as "Active" | "Inactive",
                });
              }}
            >
              <div className="mb-4">
                <label className="block mb-2">Department Name</label>
                <input
                  type="text"
                  name="department"
                  defaultValue={selectedDepartment.department}
                  className="border rounded px-4 py-2 w-full"
                  required
                  placeholder="Enter department name"
                  title="Department Name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Status</label>
                <select
                  name="status"
                  defaultValue={selectedDepartment.status}
                  className="border rounded px-4 py-2 w-full"
                  title="Department Status"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Department Modal */}
      {isViewDialogOpen && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Modal Background */}
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsViewDialogOpen(false)} // Close the modal when clicking outside
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white p-8 rounded shadow-lg w-1/2 z-10">
            <h2 className="text-2xl font-bold mb-6">View Department</h2>
            <div className="mb-4">
              <label className="block mb-2">Department Name</label>
              <input
                type="text"
                name="department"
                value={selectedDepartment.department}
                className="border rounded px-4 py-2 w-full bg-gray-100"
                readOnly
                title="Department Name"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Status</label>
              <input
                type="text"
                name="status"
                value={selectedDepartment.status}
                className="border rounded px-4 py-2 w-full bg-gray-100"
                readOnly
                title="Department Status"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
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