"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios"; // Adjust the import path based on your project structure
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons"; // Import the clock icon
import { toast } from "react-hot-toast"; // Import react-hot-toast
import ClientFaceRecognitionModal from "@/components/visitors/ClientFaceRecognitionModal";
import { formatDateTime } from '@/utils/BangladeshDateTime';

interface Visitor {
  id: number;
  name: string;
  phone: string;
  email?: string;
  image_pp?: string;
  face_descriptors?: number[];  // or face_descriptors depending on your API
}

export default function VisitorPage() {
  const [phone, setPhone] = useState("");
  const [visitor, setVisitor] = useState<{ name: string; phone: string; email?: string; image_pp?: string } | null>(null);
  const [appointments, setAppointments] = useState<
    {
      appointments: {
        id: string;
        appointment_type: string;
        topic: string;
        start_date: string;
        end_date: string;
        start_time: string;
        end_time: string;
        note: string;
      };
      appointment_guest: {
        id: string;
        appointment_id: string;
        visitor_id: string;
        tag: string;
      };
    }[]
  >([]);
  const [error, setError] = useState("");
  const [isBadgeDialogOpen, setIsBadgeDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{
    appointmentId: string;
    visitorId: string;
  } | null>(null);
  const [badge_id, setBadge_id] = useState("");
  const [note, setNote] = useState(""); // Add note state
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(true);

  useEffect(() => {
    const fetchVisitors = async () => {
      setIsLoadingVisitors(true);
      try {
        const response = await axiosInstance.get("/visitors/with-face-descriptors");
        //console.log("Raw response:", response.data); // Debug log
        
        // Handle both single visitor and array responses
        const visitorsArray = Array.isArray(response.data.visitors) 
          ? response.data.visitors 
          : response.data.visitor 
            ? [response.data.visitor]
            : [];

        const validVisitors = visitorsArray.filter(
          (v: Visitor) => 
            v.face_descriptors && 
            Array.isArray(v.face_descriptors) && 
            v.face_descriptors.length === 128
        );

        //console.log("Valid visitors:", validVisitors); // Debug log
        setAllVisitors(validVisitors);

      } catch (error) {
        console.error("Error fetching visitors:", error);
        toast.error("Failed to load visitor data");
      } finally {
        setIsLoadingVisitors(false);
      }
    };

    fetchVisitors();
  }, []);

  const handleSearch = async () => {
    try {
      setError("");
      const response = await axiosInstance.get(`/desk/visitor?phone=${phone}`);
      setVisitor(response.data.visitor);
      setAppointments(response.data.appointments);
    } catch (err) {
      setVisitor(null);
      setAppointments([]);
      setError((err as any).response?.data?.error || "Failed to fetch visitor data");
    }
  };

  const handleClockClick = (appointmentId: string, visitorId: string) => {
    setSelectedAppointment({ appointmentId, visitorId });
    setIsBadgeDialogOpen(true); // Open the badge dialog
  };

  const handleBadgeSubmit = async () => {
    if (!badge_id) {
      toast.error("Badge number is required.");
      return;
    }

    try {
      const checkInTime = formatDateTime(new Date());

      await axiosInstance.post("/attendance_logs", {
        appointment_id: selectedAppointment?.appointmentId,
        visitor_id: selectedAppointment?.visitorId,
        badge_id: badge_id,
        check_in_time: checkInTime,
        note: note,
      });

      // Show success toaster
      toast.success("Attendance logged successfully!");
      
      // Reset state and refresh the screen
      setPhone("");
      setVisitor(null);
      setAppointments([]);
      setBadge_id("");
      setNote("");
      setIsBadgeDialogOpen(false);
    } catch (err) {
      console.error("Error submitting badge:", err);
      toast.error("Failed to log attendance. Please try again.");
    }
  };

  // Add this handler
  const handleFaceRecognitionMatch = async (matchedVisitor: any) => {
    setVisitor(matchedVisitor);
    setIsFaceModalOpen(false);
    toast.success(`Matched: ${matchedVisitor.name}`);

    // Fetch appointments for the matched visitor
    try {
      // Use phone or another unique identifier
      const response = await axiosInstance.get(`/desk/visitor?phone=${matchedVisitor.phone}`);
      setAppointments(response.data.appointments);
    } catch (err) {
      setAppointments([]);
      toast.error("Failed to fetch appointments for this visitor.");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Card */}
      <div className="bg-blue-500 text-white p-4 rounded shadow flex items-center justify-between">
        <h2 className="text-lg font-bold">Visitor Identification</h2>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Enter Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="p-2 rounded border border-gray-300"
          />
          <button
            onClick={handleSearch}
            className="bg-white text-blue-500 px-4 py-2 rounded shadow"
          >
            Search
          </button>
          <button
            className={`bg-white text-blue-500 px-4 py-2 rounded shadow ${
              isLoadingVisitors ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => setIsFaceModalOpen(true)}
            disabled={isLoadingVisitors}
          >
            {isLoadingVisitors ? 'Loading Visitors...' : 'Face Recognition'}
          </button>
        </div>
      </div>

      {/* Visitor Data Card */}
      <div className="bg-white p-4 rounded shadow flex flex-row items-center">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">Visitor Details</h3>
          {error && <p className="text-red-500">{error}</p>}
          {visitor ? (
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {visitor.name}
              </p>
              <p>
                <strong>Phone:</strong> {visitor.phone}
              </p>
              <p>
                <strong>Email:</strong> {visitor.email || "N/A"}
              </p>
            </div>
          ) : (
            <p>No visitor data available. Please search for a visitor.</p>
          )}
        </div>
        {/* Visitor Image */}
        <div className="flex-shrink-0 ml-auto">
          <img
            src={visitor && visitor.image_pp ? `/images/${visitor.image_pp}` : "/images/default.png"}
            alt="Visitor profile"
            className="w-48 h-48 rounded-full object-cover border border-gray-300"
          />
        </div>
      </div>

      {/* Appointments Data Card */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-2">Appointments</h3>
        {appointments.length > 0 ? (
          <ul className="space-y-2">
            {appointments.map((appointment) => (
              <li
                key={appointment.appointment_guest.id} // Use appointment_guest.id as the key
                className="p-2 border border-gray-300 rounded flex justify-between items-center"
              >
                <div className="flex-1">
                  <p>
                    <strong>Type:</strong> {appointment.appointments.appointment_type}
                  </p>
                  <p>
                    <strong>Topic:</strong> {appointment.appointments.topic}
                  </p>
                  <p>
                    <strong>Date:</strong> {appointment.appointments.start_date} -{" "}
                    {appointment.appointments.end_date}
                  </p>
                  <p>
                    <strong>Time:</strong> {appointment.appointments.start_time} -{" "}
                    {appointment.appointments.end_time}
                  </p>
                </div>
                <FontAwesomeIcon
                  icon={faClock}
                  className="text-blue-500 cursor-pointer"
                  style={{ width: "64px", height: "64px" }} // Larger clock icon
                  onClick={() =>
                    handleClockClick(
                      appointment.appointments.id,
                      appointment.appointment_guest.visitor_id
                    )
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No appointments available for this visitor.</p>
        )}
      </div>

      {/* Badge Dialog */}
      {isBadgeDialogOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Enter Badge Details</h3>
            <input
              type="text"
              value={badge_id}
              onChange={(e) => setBadge_id(e.target.value)}
              className="border rounded px-4 py-2 w-full mb-4"
              placeholder="Badge Number"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="border rounded px-4 py-2 w-full mb-4 resize-none"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                onClick={() => {
                  setIsBadgeDialogOpen(false);
                  setBadge_id("");
                  setNote("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleBadgeSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Recognition Modal */}
      <ClientFaceRecognitionModal
        open={isFaceModalOpen}
        visitors={allVisitors}
        onClose={() => setIsFaceModalOpen(false)}
        onMatch={handleFaceRecognitionMatch}
      />
    </div>
  );
}