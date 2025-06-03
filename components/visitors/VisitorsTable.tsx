import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faRemove, faEye, faCamera, faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import { Visitor } from "@/types/visitor";

interface VisitorsTableProps {
  visitors: Visitor[];
  onView: (visitor: Visitor) => void;
  onEdit: (visitor: Visitor) => void;
  onDelete: (visitorId: number) => void;
  onCameraClick?: (visitor: Visitor) => void;
  sortColumn?: string | null;
  sortOrder?: "asc" | "desc";
  onSort?: (column: string) => void;
}

const getSortIcon = (active: boolean, order?: "asc" | "desc") => {
  if (!active) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-400" />;
  return order === "asc"
    ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-blue-600" />
    : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-blue-600" />;
};

const VisitorsTable: React.FC<VisitorsTableProps> = ({
  visitors,
  onView,
  onEdit,
  onDelete,
  onCameraClick,
  sortColumn,
  sortOrder,
  onSort,
}) => (
  <table className="w-full border-collapse border border-gray-300">
    <thead>
      <tr className="bg-gray-200 text-gray-700">
        <th
          className="border border-gray-300 px-4 py-2 cursor-pointer select-none"
          onClick={() => onSort && onSort("name")}
        >
          Name {getSortIcon(sortColumn === "name", sortOrder)}
        </th>
        <th
          className="border border-gray-300 px-4 py-2 cursor-pointer select-none"
          onClick={() => onSort && onSort("email")}
        >
          Email {getSortIcon(sortColumn === "email", sortOrder)}
        </th>
        <th
          className="border border-gray-300 px-4 py-2 cursor-pointer select-none"
          onClick={() => onSort && onSort("phone")}
        >
          Phone {getSortIcon(sortColumn === "phone", sortOrder)}
        </th>
        <th
          className="border border-gray-300 px-4 py-2 cursor-pointer select-none"
          onClick={() => onSort && onSort("gender")}
        >
          Gender {getSortIcon(sortColumn === "gender", sortOrder)}
        </th>
        <th
          className="border border-gray-300 px-4 py-2 cursor-pointer select-none"
          onClick={() => onSort && onSort("company")}
        >
          Company {getSortIcon(sortColumn === "company", sortOrder)}
        </th>
        <th
          className="border border-gray-300 px-4 py-2 cursor-pointer select-none"
          onClick={() => onSort && onSort("status")}
        >
          Status {getSortIcon(sortColumn === "status", sortOrder)}
        </th>
        <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
      </tr>
    </thead>
    <tbody>
      {visitors.map((visitor) => (
        <tr
          key={visitor.id}
          className="odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
        >
          <td className="border border-gray-300 px-4 py-2">{visitor.name}</td>
          <td className="border border-gray-300 px-4 py-2">{visitor.email || "-"}</td>
          <td className="border border-gray-300 px-4 py-2">{visitor.phone}</td>
          <td className="border border-gray-300 px-4 py-2">{visitor.gender}</td>
          <td className="border border-gray-300 px-4 py-2">{visitor.company || "-"}</td>
          <td className="border border-gray-300 px-4 py-2">{visitor.status}</td>
          <td className="border border-gray-300 px-4 py-2 text-left">
            <button
              className="text-blue-500 hover:underline mr-2"
              onClick={() => onView(visitor)}
              title="View"
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
            <button
              className="text-green-500 hover:underline mr-2"
              onClick={() => onEdit(visitor)}
              title="Edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              className="text-red-500 hover:underline mr-2"
              onClick={() => onDelete(visitor.id!)}
              title="Delete"
            >
              <FontAwesomeIcon icon={faRemove} />
            </button>
            <button
              className="text-gray-500 hover:underline ml-4"
              onClick={() => onCameraClick && onCameraClick(visitor)}
              title="Capture Photo"
            >
              <FontAwesomeIcon icon={faCamera} />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default VisitorsTable;
