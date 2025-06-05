"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Designation } from "@/types/Designation";
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

// Zod schema
const designationSchema = z.object({
  designation: z.string().min(2, "Designation name is required").max(255, "Designation name too long"),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required" }),
});

type DesignationForm = z.infer<typeof designationSchema>;

export default function DesignationPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<Designation | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Add Designation Form
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm<DesignationForm>({
    resolver: zodResolver(designationSchema),
    defaultValues: { designation: "", status: "Active" },
  });

  // Edit Designation Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<DesignationForm>({
    resolver: zodResolver(designationSchema),
  });

  // Fetch designations
  const fetchDesignations = async () => {
    try {
      const response = await axiosInstance.get("/designations", {
        params: {
          page: currentPage,
          pageSize,
          search: searchTerm,
          sortColumn: sortColumn || "id",
          sortOrder: sortOrder || "desc",
        },
      });
      setDesignations(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      console.error("Failed to fetch designations:", error);
      toast.error(error?.response?.data?.error || "Failed to fetch designations");
    }
  };

  useEffect(() => {
    fetchDesignations();
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

  // Handle Add Designation
  const onAddDesignation = async (data: DesignationForm) => {
    try {
      await axiosInstance.post("/designations", data);
      setIsAddFormOpen(false);
      resetAdd({ designation: "", status: "Active" });
      toast.success("Designation added successfully!");
      
      // Reset to first page and ensure proper sorting for new records
      setCurrentPage(1);
      setSortColumn("id");
      setSortOrder("desc");
      
      // Fetch designations to show the new record at the top
      fetchDesignations();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to add designation.");
    }
  };

  // Handle Edit Designation
  const onEditDesignation = async (data: DesignationForm) => {
    try {
      if (!selectedDesignation) return;
      await axiosInstance.patch(`/designations/${selectedDesignation.id}`, data);
      setIsEditFormOpen(false);
      setSelectedDesignation(null);
      toast.success("Designation updated successfully!");
      fetchDesignations();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update designation.");
    }
  };

  // Handle Delete Designation
  const handleDeleteDesignation = async (id: number) => {
    if (confirm("Are you sure you want to delete this designation?")) {
      try {
        await axiosInstance.delete(`/designations/${id}`);
        toast.success("Designation deleted.");
        fetchDesignations();
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to delete designation.");
      }
    }
  };

  // Open Edit Form
  const openEditForm = (designation: Designation) => {
    setSelectedDesignation(designation);
    resetEdit({
      designation: designation.designation,
      status: designation.status as "Active" | "Inactive",
    });
    setIsEditFormOpen(true);
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-blue-500 font-extrabold">Designations</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search designations..."
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

      {/* Designations Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th 
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("designation")}
            >
              Designation {getSortIcon("designation")}
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
          {designations.length > 0 ? (
            designations.map((designation) => (
              <tr
                key={designation.id}
                className="odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              >
                <td className="border border-gray-300 px-4 py-2">{designation.designation}</td>
                <td className="border border-gray-300 px-4 py-2">{designation.status}</td>
                <td className="border border-gray-300 px-4 py-2 text-left">
                  <button
                    className="text-blue-500 hover:underline mr-2"
                    onClick={() => {
                      setSelectedDesignation(designation);
                      setIsViewDialogOpen(true);
                    }}
                    title="View"
                  >
                    <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                  </button>
                  <button
                    className="text-green-500 hover:underline mr-2"
                    onClick={() => openEditForm(designation)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDeleteDesignation(designation.id!)}
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
                No designations found.
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

      {/* Add Designation Form */}
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
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Add Designation</h2>
            <form onSubmit={handleSubmitAdd(onAddDesignation)}>
              <div className="mb-4">
                <label className="block mb-2">Designation Name</label>
                <input
                  type="text"
                  {...registerAdd("designation")}
                  className={`border rounded px-4 py-2 w-full ${errorsAdd.designation ? "border-red-500" : ""}`}
                  placeholder="Enter designation name"
                />
                {errorsAdd.designation && (
                  <p className="text-red-600 text-sm mt-1">{errorsAdd.designation.message}</p>
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
                  onClick={() => resetAdd({ designation: "", status: "Active" })}
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

      {/* Edit Designation Form */}
      {isEditFormOpen && selectedDesignation && (
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
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Edit Designation</h2>
            <form onSubmit={handleSubmitEdit(onEditDesignation)}>
              <div className="mb-4">
                <label className="block mb-2">Designation Name</label>
                <input
                  type="text"
                  {...registerEdit("designation")}
                  className={`border rounded px-4 py-2 w-full ${errorsEdit.designation ? "border-red-500" : ""}`}
                  placeholder="Enter designation name"
                />
                {errorsEdit.designation && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.designation.message}</p>
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

      {/* View Designation Dialog */}
      {isViewDialogOpen && selectedDesignation && (
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
            <h2 className="text-2xl font-bold mb-6">Designation Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation Name</label>
                <p className="text-gray-900">{selectedDesignation.designation}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900">{selectedDesignation.status}</p>
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