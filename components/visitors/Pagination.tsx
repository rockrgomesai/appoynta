import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDoubleLeft,
  faAngleLeft,
  faAngleRight,
  faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="flex justify-between items-center mt-4">
      {/* First and Previous Buttons */}
      <div>
        <button
          className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-blue-900 w-6 h-6" />
        </button>
        <button
          className="px-4 py-2 rounded hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          <FontAwesomeIcon icon={faAngleLeft} className="text-blue-900 w-6 h-6" />
        </button>
      </div>

      {/* Page Display and Size Selector */}
      <div className="text-gray-700 flex items-center space-x-2">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <select
          className="border rounded px-4 py-2 shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1); // Reset to first page when changing page size
          }}
          title="Select page size"
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
          className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FontAwesomeIcon icon={faAngleRight} className="text-blue-900 w-6 h-6" />
        </button>
        <button
          className="px-4 py-2 rounded hover:bg-gray-200 transition shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <FontAwesomeIcon icon={faAngleDoubleRight} className="text-blue-900 w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
