import React from "react";
import { Visitor } from "@/types/visitor";

interface VisitorViewModalProps {
  open: boolean;
  visitor: Visitor | null;
  onClose: () => void;
}

const VisitorViewModal: React.FC<VisitorViewModalProps> = ({ open, visitor, onClose }) => {
  if (!open || !visitor) return null;
  const imageUrl = visitor.image_pp
    ? `/images/${visitor.image_pp}`
    : (visitor as any).image_pp
      ? `/images/${(visitor as any).image_pp}`
      : "/images/default.png";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-500/50" onClick={onClose}></div>
      <div className="relative bg-white p-8 rounded shadow-lg w-[1400px] flex flex-col z-10">
        <button
          type="button"
          title="Close"
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6">Visitor Details</h2>
        <div className="flex gap-8">
          {/* Info Card */}
          <div className="w-[640px] h-[480px] rounded border bg-gray-50 flex flex-col justify-center p-8">
            <div className="mb-4"><span className="font-bold">Name:</span> {visitor.name}</div>
            <div className="mb-4"><span className="font-bold">Email:</span> {visitor.email || '-'}</div>
            <div className="mb-4"><span className="font-bold">Phone:</span> {visitor.phone}</div>
            <div className="mb-4"><span className="font-bold">WhatsApp:</span> {visitor.whatsapp}</div>
            <div className="mb-4"><span className="font-bold">Gender:</span> {visitor.gender}</div>
            <div className="mb-4"><span className="font-bold">Company:</span> {visitor.company || '-'}</div>
            <div className="mb-4"><span className="font-bold">NID:</span> {visitor.nid || '-'}</div>
            <div className="mb-4"><span className="font-bold">Status:</span> {visitor.status}</div>
            <div className="mb-4"><span className="font-bold">Note:</span> {visitor.note || '-'}</div>
          </div>
          {/* Image Card */}
          <div className="w-[640px] h-[480px] rounded border bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src={imageUrl}
              alt="Visitor Photo"
              className="w-full h-full object-cover"
              width={640}
              height={480}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default VisitorViewModal;
