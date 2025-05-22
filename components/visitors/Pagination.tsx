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
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  return (
    <div className="flex justify-between items-center mt-4">
      <div>
        <button
          type="button"
          className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
          aria-label="First Page"
        >
          <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-blue-900 w-6 h-6" />
        </button>
        <button
          type="button"
          title="Previous Page"
          className="px-4 py-2 rounded hover:bg-gray-200 transition"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          <FontAwesomeIcon icon={faAngleLeft} className="text-blue-900 w-6 h-6" />
        </button>
      </div>
      <div className="text-gray-700">
        Page {currentPage} of {totalPages}
      </div>
      <div>
        <select
          className="border rounded px-4 py-2"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          title="Rows per page"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      <div>
        <button
          type="button"
          title="Next Page"
          className="px-4 py-2 rounded mr-2 hover:bg-gray-200 transition"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FontAwesomeIcon icon={faAngleRight} className="text-blue-900 w-6 h-6" />
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded hover:bg-gray-200 transition"
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
