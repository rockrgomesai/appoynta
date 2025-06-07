"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Department } from "@/types/Department";
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

// Zod schema based on your DB schema
const departmentSchema = z.object({
  department: z.string().min(2, "Department name is required").max(255, "Department name too long"),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required" }),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

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
  const [sortColumn, setSortColumn] = useState<string | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Add Department Form
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { department: "", status: "Active" },
  });

  // Edit Department Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
  });

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get("/departments", {
        params: {
          page: currentPage,
          pageSize,
          search: searchTerm,
          sortColumn: sortColumn || "id",
          sortOrder: sortOrder || "desc",
        },
      });
      setDepartments(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      console.error("Failed to fetch departments:", error);
      toast.error(error?.response?.data?.error || "Failed to fetch departments");
    }
  };

  useEffect(() => {
    fetchDepartments();
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

  // Handle Add Department
  const onAddDepartment = async (data: DepartmentForm) => {
    try {
      await axiosInstance.post("/departments", data);
      setIsAddFormOpen(false);
      resetAdd({ department: "", status: "Active" });
      toast.success("Department added successfully!");
      
      // Reset to first page and ensure proper sorting for new records
      setCurrentPage(1);
      setSortColumn("id");
      setSortOrder("desc");
      
      // Fetch departments to show the new record at the top
      fetchDepartments();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to add department.");
    }
  };

  // Handle Edit Department
  const onEditDepartment = async (data: DepartmentForm) => {
    try {
      if (!selectedDepartment) return;
      await axiosInstance.patch(`/departments/${selectedDepartment.id}`, data);
      setIsEditFormOpen(false);
      setSelectedDepartment(null);
      toast.success("Department updated successfully!");
      fetchDepartments();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update department.");
    }
  };

  // Handle Delete Department
  const handleDeleteDepartment = async (id: number) => {
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        await axiosInstance.delete(`/departments/${id}`);
        toast.success("Department deleted.");
        fetchDepartments();
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to delete department.");
      }
    }
  };

  // Open Edit Form
  const openEditForm = (department: Department) => {
    setSelectedDepartment(department);
    resetEdit({
      department: department.department,
      status: department.status as "Active" | "Inactive",
    });
    setIsEditFormOpen(true);
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-blue-500 font-extrabold">Departments</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search departments..."
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
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("department")}
            >
              Department {getSortIcon("department")}
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
          {departments.length > 0 ? (
            departments.map((department) => (
              <tr
                key={department.id}
                className="odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              >
                <td className="border border-gray-300 px-4 py-2">{department.department}</td>
                <td className="border border-gray-300 px-4 py-2">{department.status}</td>
                <td className="border border-gray-300 px-4 py-2 text-left">
                  <button
                    className="text-blue-500 hover:underline mr-2"
                    onClick={() => {
                      setSelectedDepartment(department);
                      setIsViewDialogOpen(true);
                    }}
                    title="View"
                  >
                    <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                  </button>
                  <button
                    className="text-green-500 hover:underline mr-2"
                    onClick={() => openEditForm(department)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDeleteDepartment(department.id!)}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faRemove} className="w-5 h-5" />
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
            aria-label="Items per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
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

      {/* Add Department Form */}
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
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Add Department</h2>
            <form onSubmit={handleSubmitAdd(onAddDepartment)}>
              <div className="mb-4">
                <label className="block mb-2">Department Name</label>
                <input
                  type="text"
                  {...registerAdd("department")}
                  className={`border rounded px-4 py-2 w-full ${errorsAdd.department ? "border-red-500" : ""}`}
                  placeholder="Enter department name"
                />
                {errorsAdd.department && (
                  <p className="text-red-600 text-sm mt-1">{errorsAdd.department.message}</p>
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
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={() => resetAdd({ department: "", status: "Active" })}
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

      {/* Edit Department Form */}
      {isEditFormOpen && selectedDepartment && (
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
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Edit Department</h2>
            <form onSubmit={handleSubmitEdit(onEditDepartment)}>
              <div className="mb-4">
                <label className="block mb-2">Department Name</label>
                <input
                  type="text"
                  {...registerEdit("department")}
                  className={`border rounded px-4 py-2 w-full ${errorsEdit.department ? "border-red-500" : ""}`}
                  placeholder="Enter department name"
                />
                {errorsEdit.department && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.department.message}</p>
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

      {/* View Department Modal */}
      {isViewDialogOpen && selectedDepartment && (
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
            <h2 className="text-2xl font-bold mb-6">Department Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                <p className="text-gray-900">{selectedDepartment.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900">{selectedDepartment.status}</p>
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
