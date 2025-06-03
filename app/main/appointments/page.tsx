"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faRemove, faEye, faSort, faSortUp, faSortDown, faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight, faFileAlt, faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "@/lib/axios";
import "react-datepicker/dist/react-datepicker.css";
// import ReactIOSPicker from "react-ios-time-picker"; // Commented out due to missing/incompatible package
// import "react-ios-time-picker/dist/style.css"; // Removed due to missing file
import "react-clock/dist/Clock.css";
import { format, parse, addDays } from 'date-fns';
import { toast } from "react-hot-toast";
import ReactDatePicker from "react-datepicker";

// Utility to coerce a time string to HH:mm or fallback
function coerceTimeString(val: string | undefined, fallback: string): string {
  if (val && /^\d{2}:\d{2}$/.test(val)) return val;
  return fallback;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<
    {
      id: string;
      appointment_type: string;
      topic: string;
      start_date: string;
      end_date: string;
      start_time: string;
      end_time: string;
      status: string;
      note?: string;
    }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null); // Track the column being sorted
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // Track the sorting order
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<
    {
      id: string;
      appointment_type: string;
      topic: string;
      start_date: string;
      end_date: string;
      start_time: string;
      end_time: string;
      status: string;
      note?: string;
    } | null
  >(null);
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // Track which row is expanded
  const [details, setDetails] = useState<{ hosts: any[]; guests: any[] }>({ hosts: [], guests: [] }); // Store separate hosts and guests
  const [isAddHostPopupOpen, setIsAddHostPopupOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]); // Store the list of users
  const [searchUserTerm, setSearchUserTerm] = useState(""); // Search term for filtering users
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // Debounced search term
  const [hostCurrentPage, setHostCurrentPage] = useState(1); // Current page for Add Host
  const [hostPageSize, setHostPageSize] = useState(10); // Page size for Add Host
  const [hostTotalItems, setHostTotalItems] = useState(0); // Total items for Add Host
  const [submittedHosts, setSubmittedHosts] = useState<number[]>([]); // Track submitted host IDs
  const [guests, setGuests] = useState<any[]>([]); // Store the list of guests
  const [guestCurrentPage, setGuestCurrentPage] = useState(1); // Current page for Add Guest
  const [guestPageSize, setGuestPageSize] = useState(10); // Page size for Add Guest
  const [guestTotalItems, setGuestTotalItems] = useState(0); // Total items for Add Guest
  const [submittedGuests, setSubmittedGuests] = useState<number[]>([]); // Track submitted guest IDs
  const [isAddGuestPopupOpen, setIsAddGuestPopupOpen] = useState(false); // Add Guest Popup state
  const router = useRouter();

  // Fetch appointments - Updated to use dynamic sorting
  const fetchAppointments = async () => {
    try {
      const response = await axiosInstance.get("/appointments", {
        params: {
          page: currentPage,
          pageSize,
          search: searchTerm,
          sortColumn: sortColumn || "id", // Use state value or default to "id"
          sortOrder: sortOrder || "desc", // Use state value or default to "desc"
        },
      });
      setAppointments(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to fetch appointments");
      console.error("Failed to fetch appointments:", error);
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
      setUsers(response.data.data); // Update the list of users
      setHostTotalItems(response.data.total); // Update the total number of users
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
      setGuests(response.data.data); // Update the list of guests
      setGuestTotalItems(response.data.total); // Update the total number of guests
    } catch (error) {
      console.error("Failed to fetch active guests:", error);
    }
  };

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchUserTerm);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler); // Clear timeout if the user types again
    };
  }, [searchUserTerm]);

  // Fetch users whenever the debounced search term changes
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

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, pageSize, searchTerm, sortColumn, sortOrder]);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      try {
        await axiosInstance.delete(`/appointments/${id}`);
        fetchAppointments(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete appointment:", error);
      }
    }
  };

  // Handle Sorting - Updated to ensure proper state management
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle sort order if the same column is clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending order
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const handleEditClick = (appointment: typeof selectedAppointment) => {
    setSelectedAppointment({
      ...appointment!,
      start_time: coerceTimeString(appointment?.start_time, "09:00"),
      end_time: coerceTimeString(appointment?.end_time, "17:00"),
    });
    setIsEditPopupOpen(true);
  };

  const handleAddClick = () => {
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    setSelectedAppointment({
      id: "",
      appointment_type: "",
      topic: "",
      start_date: tomorrow,
      end_date: tomorrow,
      start_time: "09:00", // Set default start time
      end_time: "17:00",   // Set default end time
      status: "Active",
      note: "",
    });
    setIsAddPopupOpen(true);
  };

  const handleViewClick = (appointment: typeof selectedAppointment) => {
    setSelectedAppointment(appointment);
    setIsViewPopupOpen(true);
  };

  const handleFileListClick = async (appointment_id: string) => {
    if (expandedRow === appointment_id) {
      // Collapse the row if it's already expanded
      setExpandedRow(null);
      setDetails({ hosts: [], guests: [] });
      return;
    }

    try {
      // Fetch hosts and guests
      const [hostsResponse, guestsResponse] = await Promise.all([
        axiosInstance.get(`/appointment_details/hosts`, { params: { appointment_id } }),
        axiosInstance.get(`/appointment_details/guests`, { params: { appointment_id } }),
      ]);

      // Ensure data is an array
      const hosts = Array.isArray(hostsResponse.data.data) ? hostsResponse.data.data : [];
      const guests = Array.isArray(guestsResponse.data.data) ? guestsResponse.data.data : [];

      // Combine hosts and guests into separate arrays
      setDetails({ hosts, guests });
      setExpandedRow(appointment_id); // Expand the row
    } catch (error) {
      console.error("Failed to fetch appointment details:", error);
    }
  };

  const handleAddHost = async (hostId: number, appointmentId: number) => {
    try {
      const response = await axiosInstance.post("/appointment_details/hosts", {
        appointment_id: appointmentId,
        host_id: hostId,
      });

      if (response.status === 201) {
        const newHost = response.data; // Assuming the API returns the newly added host details
        setSubmittedHosts((prev) => [...prev, hostId]); // Add host ID to submitted list
        setDetails((prevDetails) => ({
          ...prevDetails,
          hosts: [...prevDetails.hosts, newHost], // Add the new host to the hosts array
        }));
        toast.success("Host added successfully!"); // Show success message
      } else {
        toast.error(`Failed to add host: ${response.data.error || "Unknown error"}`); // Show error message
      }
    } catch (error: any) {
      console.error("Error adding host:", error);
      toast.error(error.response?.data?.error || "Failed to add host. Please try again."); // Show error message
    }
  };

  const handleAddGuest = async (visitorId: number, appointmentId: number) => {
    try {
      const response = await axiosInstance.post("/appointment_details/guests", {
        appointment_id: appointmentId,
        visitor_id: visitorId,
      });

      if (response.status === 201) {
        const newGuest = response.data; // Assuming the API returns the newly added guest details
        setSubmittedGuests((prev) => [...prev, visitorId]); // Add guest ID to submitted list
        setDetails((prevDetails) => ({
          ...prevDetails,
          guests: [...prevDetails.guests, newGuest], // Add the new guest to the guests array
        }));
        toast.success("Guest added successfully!"); // Show success message
      } else {
        toast.error(`Failed to add guest: ${response.data.error || "Unknown error"}`); // Show error message
      }
    } catch (error: any) {
      console.error("Error adding guest:", error);
      toast.error(error.response?.data?.error || "Failed to add guest. Please try again."); // Show error message
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-500">Appointments</h1>
        <div className="flex items-center space-x-4">
          <label htmlFor="search-appointments" className="sr-only">Search Appointments</label>
          <label htmlFor="search-appointments" className="sr-only">Search Appointments</label>
          <input
            id="search-appointments"
            type="text"
            placeholder="Search appointments..."
            title="Search appointments"
            className="border rounded px-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleAddClick}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("appointment_type")}
            >
              Type
              {sortColumn === "appointment_type" && (
                <FontAwesomeIcon
                  icon={sortOrder === "asc" ? faSortUp : faSortDown}
                  className="ml-2"
                />
              )}
            </th>
            <th
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("topic")}
            >
              Topic
              {sortColumn === "topic" && (
                <FontAwesomeIcon
                  icon={sortOrder === "asc" ? faSortUp : faSortDown}
                  className="ml-2"
                />
              )}
            </th>
            <th
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("start_date")}
            >
              Start Date
              {sortColumn === "start_date" && (
                <FontAwesomeIcon
                  icon={sortOrder === "asc" ? faSortUp : faSortDown}
                  className="ml-2"
                />
              )}
            </th>
            <th
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("end_date")}
            >
              End Date
              {sortColumn === "end_date" && (
                <FontAwesomeIcon
                  icon={sortOrder === "asc" ? faSortUp : faSortDown}
                  className="ml-2"
                />
              )}
            </th>
            <th
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("start_time")}
            >
              Start Time
              {sortColumn === "start_time" && (
                <FontAwesomeIcon
                  icon={sortOrder === "asc" ? faSortUp : faSortDown}
                  className="ml-2"
                />
              )}
            </th>
            <th
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("end_time")}
            >
              End Time
              {sortColumn === "end_time" && (
                <FontAwesomeIcon
                  icon={sortOrder === "asc" ? faSortUp : faSortDown}
                  className="ml-2"
                />
              )}
            </th>
            <th
              className="border border-gray-300 px-4 py-2 cursor-pointer"
              onClick={() => handleSort("status")}
            >
              Status
              {sortColumn === "status" && (
                <FontAwesomeIcon
                  icon={sortOrder === "asc" ? faSortUp : faSortDown}
                  className="ml-2"
                />
              )}
            </th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <React.Fragment key={appointment.id}>
                {/* Main Row */}
                <tr
                  className={`odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200 transition-colors duration-200 ${
                    expandedRow === appointment.id ? "bg-gray-500" : ""
                  }`}
                >
                  <td className="border border-gray-300 px-4 py-2">{appointment.appointment_type}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.topic}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.start_date}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.end_date}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.start_time}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.end_time}</td>
                  <td className="border border-gray-300 px-4 py-2">{appointment.status}</td>
                  <td className="border border-gray-300 px-4 py-2 flex space-x-2">
                    <button
                      className="text-blue-500 hover:underline"
                      onClick={() => handleViewClick(appointment)}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      className="text-green-500 hover:underline"
                      onClick={() => handleEditClick(appointment)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => handleDelete(appointment.id)}
                    >
                      <FontAwesomeIcon icon={faRemove} />
                    </button>
                    <button
                      className="text-gray-500 hover:underline"
                      onClick={() => handleFileListClick(appointment.id)}
                    >
                      <FontAwesomeIcon icon={faFileAlt} />
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
                                setSelectedAppointment(appointment); // Set the selected appointment
                                setIsAddHostPopupOpen(true); // Open the Add Host popup
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
                                setSelectedAppointment(appointment); // Set the selected appointment
                                setIsAddGuestPopupOpen(true); // Open the Add Guest popup
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

      {/* Add Popup */}
      {isAddPopupOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/2 relative">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddPopupOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Add Appointment</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Validate time fields
                if (!selectedAppointment?.start_time || !selectedAppointment?.end_time) {
                  toast.error("Start Time and End Time are required.");
                  return;
                }
                try {
                  // Convert dates back to "yyyy-MM-dd" before submitting
                  const formattedAppointment = {
                    ...selectedAppointment,
                    start_date: format(selectedAppointment!.start_date, "yyyy-MM-dd"),
                    end_date: format(selectedAppointment!.end_date, "yyyy-MM-dd"),
                    start_time: selectedAppointment.start_time || "09:00",
                    end_time: selectedAppointment.end_time || "17:00",
                  };
                  await axiosInstance.post("/appointments", formattedAppointment);
                  setIsAddPopupOpen(false);
                  fetchAppointments(); // Refresh the list
                } catch (error) {
                  console.error("Failed to add appointment:", error);
                }
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Row 1: Type, Topic */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    title="Appointment Type"
                    value={selectedAppointment?.appointment_type || ""}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        appointment_type: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                  >
                    <option value="" disabled>
                      Select Type
                    </option>
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
                </div>
                <div className="mb-4">
                  <label htmlFor="topic-input" className="block text-sm font-medium text-gray-700">Topic</label>
                  <input
                    id="topic-input"
                    type="text"
                    value={selectedAppointment?.topic || ""}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        topic: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                    title="Topic"
                    placeholder="Enter topic"
                  />
                </div>

                {/* Row 2: Start Date, End Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <ReactDatePicker
                    selected={
                      selectedAppointment?.start_date && !isNaN(new Date(selectedAppointment.start_date).getTime())
                        ? new Date(selectedAppointment.start_date)
                        : null
                    }
                    onChange={(date) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        start_date: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    dateFormat="dd/MM/yyyy"
                    className="border rounded px-4 py-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <ReactDatePicker
                    selected={selectedAppointment?.end_date ? new Date(selectedAppointment.end_date) : null}
                    onChange={(date) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        end_date: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    dateFormat="dd/MM/yyyy"
                    className="border rounded px-4 py-2 w-full"
                  />
                </div>

                {/* Row 3: Start Time, End Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="start-time-input">Start Time</label>
                  <input
                    id="start-time-input"
                    type="time"
                    value={selectedAppointment?.start_time || "09:00"}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        start_time: e.target.value || "09:00",
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                    required
                    title="Start Time"
                    placeholder="09:00"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="end-time-input">End Time</label>
                  <input
                    id="end-time-input"
                    type="time"
                    value={selectedAppointment?.end_time || "17:00"}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        end_time: e.target.value || "17:00",
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                    required
                    title="End Time"
                    placeholder="17:00"
                  />
                </div>

                {/* Row 4: Status, Note */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    title="Status"
                    value={selectedAppointment?.status || ""}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        status: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                  >
                    <option value="Active">Active</option>
                  </select>
                  <label htmlFor="note-input" className="block text-sm font-medium text-gray-700">Note</label>
                  <textarea
                    id="note-input"
                    title="Note"
                    placeholder="Enter note"
                    value={selectedAppointment?.note || ""}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        note: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() =>
                    setSelectedAppointment({
                      id: "",
                      appointment_type: "",
                      topic: "",
                      start_date: format(addDays(new Date(), 1), "dd/MM/yyyy"),
                      end_date: format(addDays(new Date(), 1), "dd/MM/yyyy"),
                      start_time: "",
                      end_time: "",
                      status: "",
                      note: "",
                    })
                  }
                >
                  Reset
                </button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Popup */}
      {isEditPopupOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/2 relative">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditPopupOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Appointment</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  // Always coerce time fields before submit
                  const startTime = coerceTimeString(selectedAppointment?.start_time, "09:00");
                  const endTime = coerceTimeString(selectedAppointment?.end_time, "17:00");
                  // Convert dates back to "yyyy-MM-dd" before submitting
                  const formattedAppointment = {
                    ...selectedAppointment!,
                    start_date: format(new Date(selectedAppointment!.start_date), "yyyy-MM-dd"),
                    end_date: format(new Date(selectedAppointment!.end_date), "yyyy-MM-dd"),
                    start_time: startTime,
                    end_time: endTime,
                  };
                  await axiosInstance.patch(`/appointments/${selectedAppointment.id}`, formattedAppointment);
                  setIsEditPopupOpen(false);
                  fetchAppointments(); // Refresh the list
                } catch (error) {
                  console.error("Failed to update appointment:", error);
                }
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Row 1: Type, Topic */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    title="Appointment Type"
                    value={selectedAppointment?.appointment_type || ""}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        appointment_type: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                  >
                    <option value="" disabled>
                      Select Type
                    </option>
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
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Topic</label>
                  <input
                    type="text"
                    value={selectedAppointment?.topic || ""}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        topic: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                    title="Topic"
                    placeholder="Enter topic"
                  />
                </div>

                {/* Row 2: Start Date, End Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <ReactDatePicker
                    selected={
                      selectedAppointment?.start_date && !isNaN(new Date(selectedAppointment.start_date).getTime())
                        ? new Date(selectedAppointment.start_date)
                        : null
                    }
                    onChange={(date) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        start_date: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    dateFormat="dd/MM/yyyy"
                    className="border rounded px-4 py-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <ReactDatePicker
                    selected={
                      selectedAppointment?.end_date && !isNaN(new Date(selectedAppointment.end_date).getTime())
                        ? new Date(selectedAppointment.end_date)
                        : null
                    }
                    onChange={(date) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        end_date: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    dateFormat="dd/MM/yyyy"
                    className="border rounded px-4 py-2 w-full"
                  />
                </div>

                {/* Row 3: Start Time, End Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="start-time-input">Start Time</label>
                  <input
                    id="start-time-input"
                    type="time"
                    value={selectedAppointment?.start_time || "09:00"}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        start_time: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                    title="Start Time"
                    placeholder="09:00"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="end-time-input">End Time</label>
                  <input
                    id="end-time-input"
                    type="time"
                    value={selectedAppointment?.end_time || "17:00"}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        end_time: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                    title="End Time"
                    placeholder="17:00"
                  />
                </div>

                {/* Row 4: Status, Note */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    title="Status"
                    value={selectedAppointment?.status || ""}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        status: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Note</label>
                  <textarea
                    title="Note"
                    value={selectedAppointment?.note || ""}
                    onChange={(e) =>
                      setSelectedAppointment((prev) => ({
                        ...prev!,
                        note: e.target.value,
                      }))
                    }
                    className="border rounded px-4 py-2 w-full"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setIsEditPopupOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Popup */}
      {isViewPopupOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/2 relative">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsViewPopupOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">View Appointment</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Row 1: Type, Topic */}
              <div className="mb-4">
                <label htmlFor="view-type-input" className="block text-sm font-medium text-gray-700">Type</label>
                <input
                  id="view-type-input"
                  type="text"
                  value={selectedAppointment?.appointment_type || ""}
                  readOnly
                  className="border rounded px-4 py-2 w-full bg-gray-100"
                  title="Type"
                  placeholder="Appointment type"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="view-topic-input" className="block text-sm font-medium text-gray-700">Topic</label>
                <input
                  id="view-topic-input"
                  type="text"
                  value={selectedAppointment?.topic || ""}
                  readOnly
                  className="border rounded px-4 py-2 w-full bg-gray-100"
                  title="Topic"
                  placeholder="Topic"
                />
              </div>
              {/* Row 2: Start Date, End Date */}
              <div className="mb-4">
                <label htmlFor="view-start-date-input" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  id="view-start-date-input"
                  type="text"
                  value={selectedAppointment?.start_date || ""}
                  readOnly
                  className="border rounded px-4 py-2 w-full bg-gray-100"
                  title="Start Date"
                  placeholder="Start date"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="view-end-date-input" className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  id="view-end-date-input"
                  type="text"
                  value={selectedAppointment?.end_date || ""}
                  readOnly
                  className="border rounded px-4 py-2 w-full bg-gray-100"
                  title="End Date"
                  placeholder="End date"
                />
              </div>
              {/* Row 3: Start Time, End Time */}
              <div className="mb-4">
                <label htmlFor="view-start-time-input" className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  id="view-start-time-input"
                  type="text"
                  value={selectedAppointment?.start_time || ""}
                  readOnly
                  className="border rounded px-4 py-2 w-full bg-gray-100"
                  title="Start Time"
                  placeholder="Start time"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="view-end-time-input" className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  id="view-end-time-input"
                  type="text"
                  value={selectedAppointment?.end_time || ""}
                  readOnly
                  className="border rounded px-4 py-2 w-full bg-gray-100"
                  title="End Time"
                  placeholder="End time"
                />
              </div>
              {/* Row 4: Status, Note */}
              <div className="mb-4">
                <label htmlFor="view-status-input" className="block text-sm font-medium text-gray-700">Status</label>
                <input
                  id="view-status-input"
                  type="text"
                  value={selectedAppointment?.status || ""}
                  readOnly
                  className="border rounded px-4 py-2 w-full bg-gray-100"
                  title="Status"
                  placeholder="Status"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="view-note-input" className="block text-sm font-medium text-gray-700">Note</label>
                <textarea
                  id="view-note-input"
                  title="Note"
                  placeholder="Note"
                  value={selectedAppointment?.note || ""}
                  readOnly
                  className="border rounded px-4 py-2 w-full bg-gray-100"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIsViewPopupOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Add Host Popup */}
      {isAddHostPopupOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
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
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
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

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-[5px]">
          <button
            className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-blue-900 w-6 h-6" />
          </button>
          <button
            className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleLeft} className="text-blue-900 w-6 h-6" />
          </button>
        </div>
        <div className="text-gray-700">
          Page {currentPage} of {Math.max(1, Math.ceil(totalItems / pageSize))}
        </div>
        <div>
          <select
            title="Rows per page"
            className="border rounded px-4 py-2"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1); // Reset to the first page when page size changes
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
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === Math.ceil(totalItems / pageSize)}
          >
            <FontAwesomeIcon icon={faAngleRight} className="text-blue-900 w-6 h-6" />
          </button>
          <button
            className="px-4 py-2 rounded bg-white hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
            onClick={() => setCurrentPage(Math.ceil(totalItems / pageSize))}
            disabled={currentPage === Math.ceil(totalItems / pageSize)}
          >
            <FontAwesomeIcon icon={faAngleDoubleRight} className="text-blue-900 w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}