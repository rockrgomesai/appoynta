"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faRemove, 
  faEye, 
  faSort, 
  faSortUp, 
  faSortDown, 
  faAngleDoubleLeft, 
  faAngleLeft, 
  faAngleRight, 
  faAngleDoubleRight, 
  faFileAlt, 
  faPlus, 
  faCheck 
} from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "@/lib/axios";
import "react-datepicker/dist/react-datepicker.css";
import "react-clock/dist/Clock.css";
import { format, parse, addDays } from 'date-fns';
import { toast } from "react-hot-toast";
import ReactDatePicker from "react-datepicker";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema for appointment validation
const appointmentSchema = z.object({
  appointment_type: z.enum(["Meeting", "Project", "Program", "Demo", "Delivery", "Personal", "Interview", "Maintenance", "Other"], {
    required_error: "Appointment type is required"
  }),
  topic: z.string().min(2, "Topic is required").max(255, "Topic too long"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required" }),
  note: z.string().max(500, "Note too long").optional().or(z.literal("")),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate >= startDate;
}, {
  message: "End date must be on or after start date",
  path: ["end_date"],
}).refine((data) => {
  if (data.start_date === data.end_date) {
    const [startHour, startMin] = data.start_time.split(':').map(Number);
    const [endHour, endMin] = data.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  }
  return true;
}, {
  message: "End time must be after start time on the same day",
  path: ["end_time"],
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

interface Appointment {
  id: string;
  appointment_type: string;
  topic: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: string;
  note?: string;
}

interface AppointmentsPageProps {
    user: any;
    permissions: string[];
}

export default function AppointmentsPage({ user, permissions }: AppointmentsPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Modal states
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Detail view states
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [details, setDetails] = useState<{ hosts: any[]; guests: any[] }>({ hosts: [], guests: [] });
  
  // Host/Guest popup states
  const [isAddHostPopupOpen, setIsAddHostPopupOpen] = useState(false);
  const [isAddGuestPopupOpen, setIsAddGuestPopupOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [searchUserTerm, setSearchUserTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [hostCurrentPage, setHostCurrentPage] = useState(1);
  const [hostPageSize, setHostPageSize] = useState(10);
  const [hostTotalItems, setHostTotalItems] = useState(0);
  const [guestCurrentPage, setGuestCurrentPage] = useState(1);
  const [guestPageSize, setGuestPageSize] = useState(10);
  const [guestTotalItems, setGuestTotalItems] = useState(0);
  const [submittedHosts, setSubmittedHosts] = useState<number[]>([]);
  const [submittedGuests, setSubmittedGuests] = useState<number[]>([]);

  const router = useRouter();

  // Add Appointment Form
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    setValue: setValueAdd,
    watch: watchAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointment_type: "Meeting",
      topic: "",
      start_date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      end_date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "17:00",
      status: "Active",
      note: "",
    },
  });

  // Edit Appointment Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  });

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const response = await axiosInstance.get("/appointments", {
        params: {
          page: currentPage,
          pageSize,
          search: searchTerm,
          sortColumn: sortColumn || "id",
          sortOrder: sortOrder || "desc",
        },
      });
      setAppointments(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      console.error("Failed to fetch appointments:", error);
      toast.error(error?.response?.data?.error || "Failed to fetch appointments");
    }
  };

  // Fetch active users
  const fetchActiveUsers = async (searchTerm: string) => {
    try {
      const response = await axiosInstance.get("/users", {
        params: {
          status: "Active",
          search: searchTerm,
          page: hostCurrentPage,
          pageSize: hostPageSize,
        },
      });
      setUsers(response.data.data);
      setHostTotalItems(response.data.total);
    } catch (error) {
      console.error("Failed to fetch active users:", error);
    }
  };

  const fetchActiveGuests = async (searchTerm: string) => {
    try {
      const response = await axiosInstance.get("/visitors", {
        params: {
          status: "Active",
          search: searchTerm,
          page: guestCurrentPage,
          pageSize: guestPageSize,
        },
      });
      setGuests(response.data.data);
      setGuestTotalItems(response.data.total);
    } catch (error) {
      console.error("Failed to fetch active guests:", error);
    }
  };

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchUserTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchUserTerm]);

  // Effects
  useEffect(() => {
    fetchAppointments();
  }, [currentPage, pageSize, searchTerm, sortColumn, sortOrder]);

  useEffect(() => {
    if (isAddHostPopupOpen) {
      fetchActiveUsers(debouncedSearchTerm);
    }
  }, [hostCurrentPage, hostPageSize, debouncedSearchTerm, isAddHostPopupOpen]);

  useEffect(() => {
    if (isAddGuestPopupOpen) {
      fetchActiveGuests(debouncedSearchTerm);
    }
  }, [guestCurrentPage, guestPageSize, debouncedSearchTerm, isAddGuestPopupOpen]);

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

  // Handle Add Appointment
  const onAddAppointment = async (data: AppointmentForm) => {
    try {
      await axiosInstance.post("/appointments", data);
      setIsAddFormOpen(false);
      resetAdd({
        appointment_type: "Meeting",
        topic: "",
        start_date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        end_date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "17:00",
        status: "Active",
        note: "",
      });
      toast.success("Appointment added successfully!");
      
      // Reset to first page and ensure proper sorting for new records
      setCurrentPage(1);
      setSortColumn("id");
      setSortOrder("desc");
      
      fetchAppointments();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to add appointment.");
    }
  };

  // Handle Edit Appointment
  const onEditAppointment = async (data: AppointmentForm) => {
    try {
      if (!selectedAppointment) return;
      await axiosInstance.patch(`/appointments/${selectedAppointment.id}`, data);
      setIsEditFormOpen(false);
      setSelectedAppointment(null);
      toast.success("Appointment updated successfully!");
      fetchAppointments();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update appointment.");
    }
  };

  // Handle Delete
  const handleDeleteAppointment = async (id: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      try {
        await axiosInstance.delete(`/appointments/${id}`);
        toast.success("Appointment deleted.");
        fetchAppointments();
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to delete appointment.");
      }
    }
  };

  // Helper to trim seconds from time string
  function toHHMM(time: string) {
    if (!time) return "";
    // Handles "HH:mm:ss" or "HH:mm"
    return time.length === 8 ? time.slice(0, 5) : time;
  }

  // Open Edit Form
  const openEditForm = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    resetEdit({
      appointment_type: appointment.appointment_type as any,
      topic: appointment.topic,
      start_date: appointment.start_date,
      end_date: appointment.end_date,
      start_time: toHHMM(appointment.start_time),
      end_time: toHHMM(appointment.end_time),
      status: appointment.status as "Active" | "Inactive",
      note: appointment.note || "",
    });
    setIsEditFormOpen(true);
  };

  // Handle detail expansion
  const handleFileListClick = async (appointment_id: string) => {
    if (expandedRow === appointment_id) {
      setExpandedRow(null);
      setDetails({ hosts: [], guests: [] });
      return;
    }

    try {
      const [hostsResponse, guestsResponse] = await Promise.all([
        axiosInstance.get(`/appointment_details/hosts`, { params: { appointment_id } }),
        axiosInstance.get(`/appointment_details/guests`, { params: { appointment_id } }),
      ]);

      const hosts = Array.isArray(hostsResponse.data.data) ? hostsResponse.data.data : [];
      const guests = Array.isArray(guestsResponse.data.data) ? guestsResponse.data.data : [];

      setDetails({ hosts, guests });
      setExpandedRow(appointment_id);
    } catch (error) {
      console.error("Failed to fetch appointment details:", error);
      toast.error("Failed to fetch appointment details");
    }
  };

  // Handle host/guest management
  const handleAddHost = async (hostId: number, appointmentId: number) => {
    try {
      const response = await axiosInstance.post("/appointment_details/hosts", {
        appointment_id: appointmentId,
        host_id: hostId,
      });

      if (response.status === 201) {
        const newHost = response.data;
        setSubmittedHosts((prev) => [...prev, hostId]);
        setDetails((prevDetails) => ({
          ...prevDetails,
          hosts: [...prevDetails.hosts, newHost],
        }));
        toast.success("Host added successfully!");
      }
    } catch (error: any) {
      console.error("Error adding host:", error);
      toast.error(error.response?.data?.error || "Failed to add host. Please try again.");
    }
  };

  const handleAddGuest = async (visitorId: number, appointmentId: number) => {
    try {
      const response = await axiosInstance.post("/appointment_details/guests", {
        appointment_id: appointmentId,
        visitor_id: visitorId,
      });

      if (response.status === 201) {
        const newGuest = response.data;
        setSubmittedGuests((prev) => [...prev, visitorId]);
        setDetails((prevDetails) => ({
          ...prevDetails,
          guests: [...prevDetails.guests, newGuest],
        }));
        toast.success("Guest added successfully!");
      }
    } catch (error: any) {
      console.error("Error adding guest:", error);
      toast.error(error.response?.data?.error || "Failed to add guest. Please try again.");
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-blue-500 font-extrabold">Appointments</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search appointments..."
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

      {/* Appointments Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort("appointment_type")}>
              Type {getSortIcon("appointment_type")}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort("topic")}>
              Topic {getSortIcon("topic")}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort("start_date")}>
              Start Date {getSortIcon("start_date")}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort("end_date")}>
              End Date {getSortIcon("end_date")}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort("start_time")}>
              Start Time {getSortIcon("start_time")}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort("end_time")}>
              End Time {getSortIcon("end_time")}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort("status")}>
              Status {getSortIcon("status")}
            </th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <React.Fragment key={appointment.id}>
                {/* Main Row */}
                <tr className={`odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200 transition-colors duration-200 ${
                  expandedRow === appointment.id ? "bg-gray-500" : ""
                }`}>
                  <td className="border border-gray-300 px-4 py-2">{appointment.appointment_type}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.topic}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.start_date}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.end_date}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.start_time}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.end_time}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.status}</td>
                  <td className="border border-gray-300 px-4 py-2 text-left">
                    <button
                      className="text-blue-500 hover:underline mr-2"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsViewDialogOpen(true);
                      }}
                      title="View"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                    </button>
                    <button
                      className="text-green-500 hover:underline mr-2"
                      onClick={() => openEditForm(appointment)}
                      title="Edit"
                    >
                      <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                    </button>
                    <button
                      className="text-red-500 hover:underline mr-2"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faRemove} className="w-5 h-5" />
                    </button>
                    <button
                      className="text-gray-500 hover:underline"
                      onClick={() => handleFileListClick(appointment.id)}
                      title="Details"
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5" />
                    </button>
                  </td>
                </tr>

                {/* Drill-Down Row */}
                {expandedRow === appointment.id && (
                  <tr className="bg-blue-300">
                    <td colSpan={8} className="border border-gray-300 px-4 py-2">
                      <div className="space-y-4">
                        {/* Hosts Card */}
                        <div className="bg-white shadow-md rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-700">Hosts</h3>
                            <button
                              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setIsAddHostPopupOpen(true);
                              }}
                            >
                              + Add Host
                            </button>
                          </div>
                          {details.hosts.length > 0 ? (
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-200 text-gray-700">
                                  <th className="border border-gray-300 px-4 py-2">Name</th>
                                  <th className="border border-gray-300 px-4 py-2">Department</th>
                                  <th className="border border-gray-300 px-4 py-2">Designation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {details.hosts.map((host) => (
                                  <tr key={host.id} className="odd:bg-blue-50 even:bg-blue-100">
                                    <td className="border border-gray-300 px-4 py-2">{host.name}</td>
                                    <td className="border border-gray-300 px-4 py-2">{host.department}</td>
                                    <td className="border border-gray-300 px-4 py-2">{host.designation}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-gray-500">No hosts available.</p>
                          )}
                        </div>

                        {/* Guests Card */}
                        <div className="bg-white shadow-md rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-700">Guests</h3>
                            <button
                              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setIsAddGuestPopupOpen(true);
                              }}
                            >
                              + Add Guest
                            </button>
                          </div>
                          {details.guests.length > 0 ? (
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-200 text-gray-700">
                                  <th className="border border-gray-300 px-4 py-2">Name</th>
                                  <th className="border border-gray-300 px-4 py-2">Phone</th>
                                  <th className="border border-gray-300 px-4 py-2">Company</th>
                                </tr>
                              </thead>
                              <tbody>
                                {details.guests.map((guest) => (
                                  <tr key={guest.id} className="odd:bg-blue-50 even:bg-blue-100">
                                    <td className="border border-gray-300 px-4 py-2">{guest.name}</td>
                                    <td className="border border-gray-300 px-4 py-2">{guest.phone}</td>
                                    <td className="border border-gray-300 px-4 py-2">{guest.company}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-gray-500">No guests available.</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-center py-4">
                No appointments found.
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
            title="Rows per page"
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

      {/* Add Appointment Form */}
      {isAddFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsAddFormOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 max-w-4xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddFormOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Add Appointment</h2>
            <form onSubmit={handleSubmitAdd(onAddAppointment)}>
              <div className="grid grid-cols-2 gap-6">
                <div className="mb-4">
                  <label className="block mb-2">Type</label>
                  <select
                    {...registerAdd("appointment_type")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsAdd.appointment_type ? "border-red-500" : ""}`}
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Project">Project</option>
                    <option value="Program">Program</option>
                    <option value="Demo">Demo</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Personal">Personal</option>
                    <option value="Interview">Interview</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                  {errorsAdd.appointment_type && (
                    <p className="text-red-600 text-sm mt-1">{errorsAdd.appointment_type.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Topic</label>
                  <input
                    type="text"
                    {...registerAdd("topic")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsAdd.topic ? "border-red-500" : ""}`}
                    placeholder="Enter topic"
                  />
                  {errorsAdd.topic && (
                    <p className="text-red-600 text-sm mt-1">{errorsAdd.topic.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Start Date</label>
                  <ReactDatePicker
                    selected={watchAdd("start_date") ? new Date(watchAdd("start_date")) : null}
                    onChange={(date) => setValueAdd("start_date", date ? format(date, "yyyy-MM-dd") : "")}
                    dateFormat="dd/MM/yyyy"
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsAdd.start_date ? "border-red-500" : ""}`}
                  />
                  {errorsAdd.start_date && (
                    <p className="text-red-600 text-sm mt-1">{errorsAdd.start_date.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">End Date</label>
                  <ReactDatePicker
                    selected={watchAdd("end_date") ? new Date(watchAdd("end_date")) : null}
                    onChange={(date) => setValueAdd("end_date", date ? format(date, "yyyy-MM-dd") : "")}
                    dateFormat="dd/MM/yyyy"
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsAdd.end_date ? "border-red-500" : ""}`}
                  />
                  {errorsAdd.end_date && (
                    <p className="text-red-600 text-sm mt-1">{errorsAdd.end_date.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Start Time</label>
                  <input
                    type="time"
                    {...registerAdd("start_time")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsAdd.start_time ? "border-red-500" : ""}`}
                  />
                  {errorsAdd.start_time && (
                    <p className="text-red-600 text-sm mt-1">{errorsAdd.start_time.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">End Time</label>
                  <input
                    type="time"
                    {...registerAdd("end_time")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsAdd.end_time ? "border-red-500" : ""}`}
                  />
                  {errorsAdd.end_time && (
                    <p className="text-red-600 text-sm mt-1">{errorsAdd.end_time.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Status</label>
                  <select
                    {...registerAdd("status")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsAdd.status ? "border-red-500" : ""}`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {errorsAdd.status && (
                    <p className="text-red-600 text-sm mt-1">{errorsAdd.status.message}</p>
                  )}
                </div>

                <div className="mb-4 col-span-2">
                  <label className="block mb-2">Note</label>
                  <textarea
                    {...registerAdd("note")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsAdd.note ? "border-red-500" : ""}`}
                    rows={3}
                    placeholder="Enter note"
                  />
                  {errorsAdd.note && (
                    <p className="text-red-600 text-sm mt-1">{errorsAdd.note.message}</p>
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
          </div>
        </div>
      )}

      {/* Edit Appointment Form */}
      {isEditFormOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsEditFormOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 max-w-4xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditFormOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-500">Edit Appointment</h2>
            <form onSubmit={handleSubmitEdit(onEditAppointment)}>
              <div className="grid grid-cols-2 gap-6">
                <div className="mb-4">
                  <label className="block mb-2">Type</label>
                  <select
                    {...registerEdit("appointment_type")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsEdit.appointment_type ? "border-red-500" : ""}`}
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Project">Project</option>
                    <option value="Program">Program</option>
                    <option value="Demo">Demo</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Personal">Personal</option>
                    <option value="Interview">Interview</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                  {errorsEdit.appointment_type && (
                    <p className="text-red-600 text-sm mt-1">{errorsEdit.appointment_type.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Topic</label>
                  <input
                    type="text"
                    {...registerEdit("topic")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsEdit.topic ? "border-red-500" : ""}`}
                    placeholder="Enter topic"
                  />
                  {errorsEdit.topic && (
                    <p className="text-red-600 text-sm mt-1">{errorsEdit.topic.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Start Date</label>
                  <ReactDatePicker
                    selected={watchEdit("start_date") ? new Date(watchEdit("start_date")) : null}
                    onChange={(date) => setValueEdit("start_date", date ? format(date, "yyyy-MM-dd") : "")}
                    dateFormat="dd/MM/yyyy"
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsEdit.start_date ? "border-red-500" : ""}`}
                  />
                  {errorsEdit.start_date && (
                    <p className="text-red-600 text-sm mt-1">{errorsEdit.start_date.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">End Date</label>
                  <ReactDatePicker
                    selected={watchEdit("end_date") ? new Date(watchEdit("end_date")) : null}
                    onChange={(date) => setValueEdit("end_date", date ? format(date, "yyyy-MM-dd") : "")}
                    dateFormat="dd/MM/yyyy"
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsEdit.end_date ? "border-red-500" : ""}`}
                  />
                  {errorsEdit.end_date && (
                    <p className="text-red-600 text-sm mt-1">{errorsEdit.end_date.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Start Time</label>
                  <input
                    type="time"
                    {...registerEdit("start_time")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsEdit.start_time ? "border-red-500" : ""}`}
                  />
                  {errorsEdit.start_time && (
                    <p className="text-red-600 text-sm mt-1">{errorsEdit.start_time.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">End Time</label>
                  <input
                    type="time"
                    {...registerEdit("end_time")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsEdit.end_time ? "border-red-500" : ""}`}
                  />
                  {errorsEdit.end_time && (
                    <p className="text-red-600 text-sm mt-1">{errorsEdit.end_time.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block mb-2">Status</label>
                  <select
                    {...registerEdit("status")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsEdit.status ? "border-red-500" : ""}`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {errorsEdit.status && (
                    <p className="text-red-600 text-sm mt-1">{errorsEdit.status.message}</p>
                  )}
                </div>

                <div className="mb-4 col-span-2">
                  <label className="block mb-2">Note</label>
                  <textarea
                    {...registerEdit("note")}
                    className={`border border-gray-500 rounded px-4 py-2 w-full ${errorsEdit.note ? "border-red-500" : ""}`}
                    rows={3}
                    placeholder="Enter note"
                  />
                  {errorsEdit.note && (
                    <p className="text-red-600 text-sm mt-1">{errorsEdit.note.message}</p>
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
          </div>
        </div>
      )}

      {/* View Appointment Dialog */}
      {isViewDialogOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-500/50"
            onClick={() => setIsViewDialogOpen(false)}
          ></div>
          <div className="relative bg-white p-8 rounded shadow-lg w-3/4 max-w-4xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsViewDialogOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6">Appointment Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-gray-900">{selectedAppointment.appointment_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Topic</label>
                <p className="text-gray-900">{selectedAppointment.topic}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <p className="text-gray-900">{selectedAppointment.start_date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <p className="text-gray-900">{selectedAppointment.end_date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <p className="text-gray-900">{selectedAppointment.start_time}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <p className="text-gray-900">{selectedAppointment.end_time}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900">{selectedAppointment.status}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <p className="text-gray-900">{selectedAppointment.note || 'N/A'}</p>
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

      {/* Add Host Popup */}
      {isAddHostPopupOpen && (
        <div className="fixed inset-0 bg-gray-500/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-2/3 relative">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setIsAddHostPopupOpen(false);
                setSubmittedHosts([]); // Reset submitted hosts
              }}
            >
              ✕
            </button>

            {/* Title and Search */}
            <div>
                <label htmlFor="search-hosts" className="sr-only">Search Hosts</label>
                <input
                  id="search-hosts"
                  type="text"
                  placeholder="Search by name, department, or designation..."
                  title="Search hosts"
                  className="border rounded px-4 py-2 w-full"
                  value={searchUserTerm}
                  onChange={(e) => setSearchUserTerm(e.target.value)}
                />
            </div>

            {/* Users Table */}
            {users.length > 0 ? (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="border border-gray-300 px-4 py-2">Name</th>
                    <th className="border border-gray-300 px-4 py-2">Department</th>
                    <th className="border border-gray-300 px-4 py-2">Designation</th>
                    <th className="border border-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="odd:bg-blue-50 even:bg-blue-100">
                      <td className="border border-gray-300 px-4 py-2">
                        {user.first_name + (user.last_name ? ` ${user.last_name}` : "")}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{user.department}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.designation}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            submittedHosts.includes(user.id)
                              ? "bg-green-500 text-white cursor-not-allowed"
                              : "text-green-500 hover:bg-green-200"
                          }`}
                          onClick={() => {
                            if (selectedAppointment?.id) {
                              handleAddHost(user.id, Number(selectedAppointment.id)); // Pass the valid appointment ID
                            } else {
                              toast.error("Invalid appointment ID."); // Show error if appointment ID is missing
                            }
                          }}
                          disabled={submittedHosts.includes(user.id)} // Disable button if already submitted
                        >
                          <FontAwesomeIcon
                            icon={submittedHosts.includes(user.id) ? faCheck : faPlus} // Show tick or plus icon
                            className="w-4 h-4"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No active users found.</p>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-[5px]">
                <button
                  className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => setHostCurrentPage(1)}
                  disabled={hostCurrentPage === 1}
                >
                  <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-blue-900 w-6 h-6" />
                </button>
                <button
                  className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => setHostCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={hostCurrentPage === 1}
                >
                  <FontAwesomeIcon icon={faAngleLeft} className="text-blue-900 w-6 h-6" />
                </button>
              </div>
              <div className="text-gray-700">
                Page {hostCurrentPage} of {Math.max(1, Math.ceil(hostTotalItems / hostPageSize))}
              </div>
              <div>
                <select
                  title="Rows per page"
                  className="border rounded px-4 py-2"
                  value={hostPageSize}
                  onChange={(e) => {
                    setHostPageSize(Number(e.target.value));
                    setHostCurrentPage(1); // Reset to the first page when page size changes
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <button
                  className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => setHostCurrentPage((prev) => prev + 1)}
                  disabled={hostCurrentPage === Math.ceil(hostTotalItems / hostPageSize)}
                >
                  <FontAwesomeIcon icon={faAngleRight} className="text-blue-900 w-6 h-6" />
                </button>
                <button
                  className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => setHostCurrentPage(Math.ceil(hostTotalItems / hostPageSize))}
                  disabled={hostCurrentPage === Math.ceil(hostTotalItems / hostPageSize)}
                >
                  <FontAwesomeIcon icon={faAngleDoubleRight} className="text-blue-900 w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Guest Popup */}
      {isAddGuestPopupOpen && (
        <div className="fixed inset-0 bg-gray-500/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-2/3 relative">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setIsAddGuestPopupOpen(false); // <-- Fix: close the guest popup
                setSubmittedGuests([]);        // Optionally reset submitted guests
              }}
            >
              ✕
            </button>
            <div>
              <label htmlFor="search-guests" className="sr-only">Search Guests</label>
              <input
                id="search-guests"
                type="text"
                placeholder="Search by name or phone..."
                title="Search guests"
                className="border rounded px-4 py-2 w-full"
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
              />
            </div>
            {guests.length > 0 ? (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="border border-gray-300 px-4 py-2">Name</th>
                    <th className="border border-gray-300 px-4 py-2">Phone</th>
                    <th className="border border-gray-300 px-4 py-2">Company</th>
                    <th className="border border-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id} className="odd:bg-blue-50 even:bg-blue-100">
                      <td className="border border-gray-300 px-4 py-2">{guest.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{guest.phone}</td>
                      <td className="border border-gray-300 px-4 py-2">{guest.company}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            submittedGuests.includes(guest.id)
                              ? "bg-green-500 text-white cursor-not-allowed"
                              : "text-green-500 hover:bg-green-200"
                          }`}
                          onClick={() => {
                            if (selectedAppointment?.id) {
                              handleAddGuest(
                                guest.id,
                                Number(selectedAppointment.id)
                              ); // Pass the valid appointment ID
                            } else {
                              toast.error("Invalid appointment ID."); // Show error if appointment ID is missing
                            }
                          }}
                          disabled={submittedGuests.includes(guest.id)} // Disable button if already submitted
                        >
                          <FontAwesomeIcon
                            icon={submittedGuests.includes(guest.id) ? faCheck : faPlus} // Show tick or plus icon
                            className="w-4 h-4"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No active guests found.</p>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-[5px]">
                <button
                  className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => setGuestCurrentPage(1)}
                  disabled={guestCurrentPage === 1}
                >
                  <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-blue-900 w-6 h-6" />
                </button>
                <button
                  className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => setGuestCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={guestCurrentPage === 1}
                >
                  <FontAwesomeIcon icon={faAngleLeft} className="text-blue-900 w-6 h-6" />
                </button>
              </div>
              <div className="text-gray-700">
                Page {guestCurrentPage} of {Math.max(1, Math.ceil(guestTotalItems / guestPageSize))}
              </div>
              <div>
                <select
                  title="Rows per page"
                  className="border rounded px-4 py-2"
                  value={guestPageSize}
                  onChange={(e) => {
                    setGuestPageSize(Number(e.target.value));
                    setGuestCurrentPage(1); // Reset to the first page when page size changes
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex space-x-[5px]">
                <button
                  className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => setGuestCurrentPage((prev) => prev + 1)}
                  disabled={guestCurrentPage === Math.ceil(guestTotalItems / guestPageSize)}
                >
                  <FontAwesomeIcon icon={faAngleRight} className="text-blue-900 w-6 h-6" />
                </button>
                <button
                  className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => setGuestCurrentPage(Math.ceil(guestTotalItems / guestPageSize))}
                  disabled={guestCurrentPage === Math.ceil(guestTotalItems / guestPageSize)}
                >
                  <FontAwesomeIcon icon={faAngleDoubleRight} className="text-blue-900 w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}