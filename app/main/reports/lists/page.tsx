'use client';

import { useState, useEffect } from 'react';

const reportTypes = [
  { value: 'appointments', label: 'Appointments' },
  { value: 'departments', label: 'Departments' },
  { value: 'designations', label: 'Designations' },
  { value: 'users', label: 'Users' },
  { value: 'visitors', label: 'Visitors' },
];

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

interface ReportData {
  items: any[];
  total: number;
}

export default function ListsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ReportData>({ items: [], total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });

  const fetchReportData = async (page: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(
        `/api/${selectedReport}?page=${page}&pageSize=${pagination.pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const jsonData = await res.json();
      // Update this part to match the API response structure
      setData({
        items: jsonData.data, // Changed from jsonData.data.items
        total: jsonData.total
      });
      setPagination(prev => ({
        ...prev,
        currentPage: jsonData.page,
        totalPages: Math.ceil(jsonData.total / jsonData.pageSize)
      }));
    } catch (error) {
      console.error('Error fetching report:', error);
      setData({ items: [], total: 0 }); // Reset data on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!selectedReport) return;
    fetchReportData(1);
  };

  const handlePageChange = (page: number) => {
    fetchReportData(page);
  };

  // Update the helper function with better type safety
  const getTableHeaders = (items: any[] | undefined) => {
    if (!items || !items.length) return [];
    return Object.keys(items[0]);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Existing select/button card */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6">
          <div className="flex items-center gap-4">
            {/* Custom Select Dropdown */}
            <div className="relative">
              <button
                type="button"
                className="w-[280px] flex items-center justify-between px-4 py-2 border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="text-gray-700">
                  {selectedReport ? reportTypes.find(r => r.value === selectedReport)?.label : 'Select report type'}
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  <ul className="py-1">
                    {reportTypes.map((report) => (
                      <li
                        key={report.value}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedReport(report.value);
                          setIsOpen(false);
                        }}
                      >
                        {report.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              disabled={!selectedReport}
              className={`px-4 py-2 rounded-md text-white font-medium
                ${selectedReport 
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' 
                  : 'bg-gray-300 cursor-not-allowed'
                }`}
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Results Card - With additional safety checks */}
      {data?.items && data.items.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {reportTypes.find(r => r.value === selectedReport)?.label} Report
            </h2>
            
            {/* Results Table - With improved safety checks */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {getTableHeaders(data.items).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.values(item || {}).map((value: any, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value === null || value === undefined 
                            ? '-' 
                            : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - With null checks */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, data.total)} of{' '}
                {data.total} results
              </div>
              <div className="flex gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      page === pagination.currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show a message when no data is available */}
      {!isLoading && selectedReport && (!data?.items || data.items.length === 0) && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No data available for this report.</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}