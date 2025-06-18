"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface DashboardClientProps {
  user: any;
  permissions: string[];
}

export default function DashboardClient({ user, permissions }: DashboardClientProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/dashboard/stats").then(res => {
      setStats(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  // Appointments Analytics
  const appointmentCards = [
    { label: "Total Appointments", value: stats.appointments.total, color: "bg-blue-500" },
    { label: "Upcoming Appointments", value: stats.appointments.upcoming, color: "bg-green-500" },
  ];

  const appointmentsByTypeData = {
    labels: stats.appointments.byType.map((t: any) => t.type),
    datasets: [
      {
        label: "Appointments by Type",
        data: stats.appointments.byType.map((t: any) => t.count),
        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#f59e42",
          "#ef4444",
          "#6366f1",
          "#fbbf24",
        ],
      },
    ],
  };

  const appointmentsByStatusData = {
    labels: stats.appointments.byStatus.map((s: any) => s.status),
    datasets: [
      {
        label: "Appointments by Status",
        data: stats.appointments.byStatus.map((s: any) => s.count),
        backgroundColor: ["#3b82f6", "#10b981", "#ef4444", "#fbbf24"],
      },
    ],
  };

  const appointmentsByDepartmentData = {
    labels: stats.appointments.byDepartment.map((d: any) => d.department),
    datasets: [
      {
        label: "Appointments per Department",
        data: stats.appointments.byDepartment.map((d: any) => d.count),
        backgroundColor: "#6366f1",
      },
    ],
  };

  const appointmentsByDesignationData = {
    labels: stats.appointments.byDesignation.map((d: any) => d.designation),
    datasets: [
      {
        label: "Appointments per Designation",
        data: stats.appointments.byDesignation.map((d: any) => d.count),
        backgroundColor: "#f59e42",
      },
    ],
  };

  // Attendance Analytics
  const attendanceCards = [
    { label: "Today's Check-ins", value: stats.attendance.todayCheckins, color: "bg-blue-400" },
    { label: "Today's Check-outs", value: stats.attendance.todayCheckouts, color: "bg-yellow-400" },
    { label: "Current Onsite", value: stats.attendance.currentOnsite, color: "bg-green-400" },
  ];

  const attendanceByAppointmentData = {
    labels: stats.attendance.byAppointment.map((a: any) => `Appt ${a.appointment_id}`),
    datasets: [
      {
        label: "Attendance by Appointment",
        data: stats.attendance.byAppointment.map((a: any) => a.count),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const frequentVisitorsData = {
    labels: stats.attendance.frequentVisitors.map((v: any) => v.visitor_id),
    datasets: [
      {
        label: "Check-ins",
        data: stats.attendance.frequentVisitors.map((v: any) => v.count),
        backgroundColor: "#10b981",
      },
    ],
  };

  return (
    <div className="p-8 space-y-10">
      {/* Appointments Analytics */}
      <div>
        <h2 className="text-xl font-bold mb-4">Appointments Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {appointmentCards.map(card => (
            <div key={card.label} className={`rounded-xl shadow p-6 text-white ${card.color} flex flex-col items-center`}>
              <div className="text-3xl font-bold">{card.value}</div>
              <div className="text-lg mt-2">{card.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-2 flex justify-center">
            <div className="bg-white rounded-xl shadow p-6 w-full max-w-lg">
              <h3 className="font-semibold mb-2 text-center">Appointments by Type</h3>
              <Pie data={appointmentsByTypeData} options={{ responsive: true }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold mb-2">Appointments per Department</h3>
            <Bar data={appointmentsByDepartmentData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold mb-2">Appointments per Designation</h3>
            <Bar data={appointmentsByDesignationData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 mt-8">
          <h3 className="font-semibold mb-2">Recent Appointments</h3>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-1">ID</th>
                <th className="py-1">Type</th>
                <th className="py-1">Topic</th>
                <th className="py-1">Start Date</th>
                <th className="py-1">End Date</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.appointments.recent.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="py-1">{a.id}</td>
                  <td className="py-1">{a.appointment_type}</td>
                  <td className="py-1">{a.topic}</td>
                  <td className="py-1">{a.start_date}</td>
                  <td className="py-1">{a.end_date}</td>
                  <td className="py-1">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance & Check-in/Check-out */}
      <div>
        <h2 className="text-xl font-bold mb-4">Attendance Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {attendanceCards.map(card => (
            <div key={card.label} className={`rounded-xl shadow p-6 text-white ${card.color} flex flex-col items-center`}>
              <div className="text-3xl font-bold">{card.value}</div>
              <div className="text-lg mt-2">{card.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold mb-2">Attendance by Appointment</h3>
            <Bar data={attendanceByAppointmentData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold mb-2">Frequent Visitors (Top 5)</h3>
            <Bar data={frequentVisitorsData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}
