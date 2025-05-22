import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faRemove, faEye, faUser, faFaceLaugh, faCamera } from "@fortawesome/free-solid-svg-icons";
import { Visitor } from "@/types/visitor";

interface VisitorsTableProps {
  visitors: Visitor[];
  onView: (visitor: Visitor) => void;
  onEdit: (visitor: Visitor) => void;
  onDelete: (visitorId: number) => void;
  onFaceClick?: (visitor: Visitor) => void;
  onCameraClick?: (visitor: Visitor) => void; // Add this prop
}

const VisitorsTable: React.FC<VisitorsTableProps> = ({ visitors, onView, onEdit, onDelete, onFaceClick, onCameraClick }) => (
  <table className="w-full border-collapse border border-gray-300">
    <thead>
      <tr className="bg-gray-200 text-gray-700">
        <th className="border border-gray-300 px-4 py-2">Name</th>
        <th className="border border-gray-300 px-4 py-2">Email</th>
        <th className="border border-gray-300 px-4 py-2">Phone</th>
        <th className="border border-gray-300 px-4 py-2">Gender</th>
        <th className="border border-gray-300 px-4 py-2">Company</th>
        <th className="border border-gray-300 px-4 py-2">Status</th>
        <th className="border border-gray-300 px-4 py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {visitors.length > 0 ? (
        visitors.map((visitor) => (
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
            <td className="border border-gray-300 px-4 py-2 text-center">
              <button
                type="button"
                className="text-blue-500 hover:underline mr-2"
                title="View Visitor"
                onClick={() => onView(visitor)}
              >
                <FontAwesomeIcon icon={faEye} className="text-blue-500 w-5 h-5" />
                <span className="sr-only">View Visitor</span>
              </button>
              <button
                type="button"
                className="text-green-500 hover:underline mr-2"
                title="Edit Visitor"
                onClick={() => onEdit(visitor)}
              >
                <FontAwesomeIcon icon={faEdit} className="text-green-500 w-5 h-5" />
                <span className="sr-only">Edit Visitor</span>
              </button>
              <button
                type="button"
                className="text-red-500 hover:underline"
                title="Delete Visitor"
                onClick={() => onDelete(visitor.id!)}
              >
                <FontAwesomeIcon icon={faRemove} className="text-red-500 w-5 h-5" />
                <span className="sr-only">Delete Visitor</span>
              </button>
              <button
                type="button"
                className="ml-5 text-indigo-500 hover:underline"
                title="Face"
                aria-label="Face"
                onClick={() => {
                  console.log('Face icon button clicked', visitor);
                  onFaceClick && onFaceClick(visitor);
                }}
              >
                <FontAwesomeIcon icon={faUser} className="text-indigo-500 w-6 h-6" />
                <span className="sr-only">Face</span>
              </button>
              <button
                onClick={() => onCameraClick && onCameraClick(visitor)}
                className="text-blue-500 hover:text-blue-700 mx-1"
                title="Take Photo"
              >
                <FontAwesomeIcon icon={faCamera} />
              </button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={7} className="text-center py-4">
            No visitors found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default VisitorsTable;
