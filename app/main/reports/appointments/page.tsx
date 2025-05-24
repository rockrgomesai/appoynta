"use client";
import React, { useState, useRef } from "react";
import axiosInstance from "@/lib/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateForInput(dateStr: string) {
  if (!dateStr) return "";
  // Ensure date is in YYYY-MM-DD format for HTML date input
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

function parseInputDate(value: string) {
  return value; // Keep the YYYY-MM-DD format from date picker
}

export default function AppointmentsReportPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const printRef = useRef<HTMLDivElement>(null);

  const paginatedResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(results.length / pageSize);

  const handleOk = async () => {
    setError("");
    setLoading(true);
    setResults([]);
    try {
      const res = await axiosInstance.get("/reports/appointments/guest-attendance", {
        params: { from_date: fromDate, to_date: toDate },
      });
      setResults(res.data.data || []);
      setCurrentPage(1);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!results.length) return;
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;
    const tableRows = results.map((row, idx) => `
      <tr style='background:${idx % 2 === 0 ? "#e0f2fe" : "#bae6fd"};'>
        <td style='border:1px solid #ccc;padding:4px;'>${idx + 1}</td>
        <td style='border:1px solid #ccc;padding:4px;'>${row.visitor_name}</td>
        <td style='border:1px solid #ccc;padding:4px;'>${row.appointment_topic}</td>
        <td style='border:1px solid #ccc;padding:4px;'>${row.appointment_type}</td>
        <td style='border:1px solid #ccc;padding:4px;'>${row.check_in_time ? formatDisplayDate(row.check_in_time.slice(0,10)) + ' ' + row.check_in_time.slice(11,16) : ''}</td>
        <td style='border:1px solid #ccc;padding:4px;'>${row.check_out_time ? formatDisplayDate(row.check_out_time.slice(0,10)) + ' ' + row.check_out_time.slice(11,16) : ''}</td>
      </tr>`).join('');
    const html = `
      <html><head><title>Guest Attendance Report</title></head><body>
      <h2 style='text-align:center;'>Guest Attendance Report</h2>
      <table style='width:100%;border-collapse:collapse;font-size:14px;'>
        <thead>
          <tr style='background:#f1f5f9;'>
            <th style='border:1px solid #ccc;padding:4px;'>#</th>
            <th style='border:1px solid #ccc;padding:4px;'>Guest Name</th>
            <th style='border:1px solid #ccc;padding:4px;'>Topic</th>
            <th style='border:1px solid #ccc;padding:4px;'>Type</th>
            <th style='border:1px solid #ccc;padding:4px;'>Check In</th>
            <th style='border:1px solid #ccc;padding:4px;'>Check Out</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="p-4">
      {/* Thin Card with Date Inputs and OK Button */}
      <div className="flex items-center justify-between bg-white shadow rounded px-4 py-2 mb-6 w-full max-w-3xl mx-auto border border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="from-date" className="block text-xs font-medium text-gray-600 mb-1">
              From Date ({formatDisplayDate(fromDate)})
            </label>
            <DatePicker
              id="from-date"
              selected={fromDate ? new Date(fromDate) : null}
              onChange={date => setFromDate(date ? parseInputDate(date.toISOString().split('T')[0]) : "")}
              dateFormat="dd/MM/yyyy"
              className="border rounded px-2 py-1 text-sm [&::-webkit-datetime-edit]: text-right"
              placeholderText="Select date"
            />
          </div>
          <div>
            <label htmlFor="to-date" className="block text-xs font-medium text-gray-600 mb-1">
              To Date ({formatDisplayDate(toDate)})
            </label>
            <DatePicker
              id="to-date"
              selected={toDate ? new Date(toDate) : null}
              onChange={date => setToDate(date ? parseInputDate(date.toISOString().split('T')[0]) : "")}  
              dateFormat="dd/MM/yyyy"
              className="border rounded px-2 py-1 text-sm [&::-webkit-datetime-edit]: text-right"
            placeholderText="Select date"
            />
          </div>
        </div>
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-blue-600 transition min-w-[64px]"
          onClick={handleOk}
          disabled={!fromDate || !toDate || loading}
        >
          {loading ? "Loading..." : "OK"}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

      {/* Results Table + Print Button */}
      {results.length > 0 && (
        <div className="max-w-3xl mx-auto bg-white shadow rounded p-4 border border-gray-200">
          <div className="flex justify-end mb-2">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-green-700 transition"
              onClick={handlePrint}
              title="Print PDF"
            >
              Print PDF
            </button>
          </div>
          <div ref={printRef}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border">#</th>
                  <th className="px-2 py-1 border">Guest Name</th>
                  <th className="px-2 py-1 border">Topic</th>
                  <th className="px-2 py-1 border">Type</th>
                  <th className="px-2 py-1 border">Check In</th>
                  <th className="px-2 py-1 border">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((row, idx) => (
                  <tr key={idx} className="odd:bg-blue-50 even:bg-blue-100">
                    <td className="px-2 py-1 border">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="px-2 py-1 border">{row.visitor_name}</td>
                    <td className="px-2 py-1 border">{row.appointment_topic}</td>
                    <td className="px-2 py-1 border">{row.appointment_type}</td>
                    <td className="px-2 py-1 border">{row.check_in_time ? formatDisplayDate(row.check_in_time.slice(0,10)) + ' ' + row.check_in_time.slice(11,16) : ''}</td>
                    <td className="px-2 py-1 border">{row.check_out_time ? formatDisplayDate(row.check_out_time.slice(0,10)) + ' ' + row.check_out_time.slice(11,16) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <select
              className="ml-4 border rounded px-2 py-1"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              title="Rows per page"
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
