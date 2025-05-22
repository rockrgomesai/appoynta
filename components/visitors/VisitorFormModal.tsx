import React, { useState } from "react";
import { Visitor } from "@/types/visitor";

interface VisitorFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialData?: Visitor | null;
  onClose: () => void;
  onSubmit: (data: Omit<Visitor, "id"> | Visitor) => void;
}

const VisitorFormModal: React.FC<VisitorFormModalProps> = ({ open, mode, initialData, onClose, onSubmit }) => {
  const isEdit = mode === "edit" && initialData;
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (open) setErrors({});
  }, [open]);

  if (!open) return null;

  const validate = (data: any) => {
    const errs: { [key: string]: string } = {};
    if (!data.name) errs.name = "Name is required";
    if (!data.phone) errs.phone = "Phone is required";
    if (!data.gender) errs.gender = "Gender is required";
    // Add more validation as needed
    return errs;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const visitorData = Object.fromEntries(formData.entries());
    const data = {
      ...(isEdit ? { id: initialData!.id } : {}),
      name: visitorData.name as string,
      email: visitorData.email as string,
      phone: visitorData.phone as string,
      whatsapp: visitorData.whatsapp as "Yes" | "No",
      gender: visitorData.gender as "Male" | "Female" | "Other",
      company: visitorData.company as string,
      nid: visitorData.nid as string,
      note: visitorData.note as string,
      status: visitorData.status as "Active" | "Inactive",
    };
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-500/50" onClick={onClose}></div>
      <div className="relative bg-white p-8 rounded shadow-lg w-3/4 z-10">
        <button
          type="button"
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          title="Close"
          aria-label="Close"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6">{isEdit ? "Edit Visitor" : "Add Visitor"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-6">
            <div className="mb-4">
              <label className="block mb-2">Name</label>
              <input type="text" name="name" className="border rounded px-4 py-2 w-full" placeholder="Enter name" title="Name" defaultValue={isEdit ? initialData?.name : ""} />
              {errors.name && <div className="text-red-600 text-xs mt-1">{errors.name}</div>}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Email</label>
              <input type="email" name="email" className="border rounded px-4 py-2 w-full" placeholder="Enter email" title="Email" defaultValue={isEdit ? (initialData?.email || "") : ""} />
              {errors.email && <div className="text-red-600 text-xs mt-1">{errors.email}</div>}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Phone</label>
              <input type="text" name="phone" className="border rounded px-4 py-2 w-full" placeholder="Enter phone" title="Phone" defaultValue={isEdit ? initialData?.phone : ""} />
              {errors.phone && <div className="text-red-600 text-xs mt-1">{errors.phone}</div>}
            </div>
            <div className="mb-4">
              <label className="block mb-2">WhatsApp</label>
              <select name="whatsapp" className="border rounded px-4 py-2 w-full" defaultValue={isEdit ? initialData?.whatsapp : "No"} title="WhatsApp">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.whatsapp && <div className="text-red-600 text-xs mt-1">{errors.whatsapp}</div>}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Gender</label>
              <select name="gender" className="border rounded px-4 py-2 w-full" defaultValue={isEdit ? initialData?.gender : undefined} title="Gender">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <div className="text-red-600 text-xs mt-1">{errors.gender}</div>}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Company</label>
              <input type="text" name="company" className="border rounded px-4 py-2 w-full" placeholder="Enter company" title="Company" defaultValue={isEdit ? initialData?.company : ""} />
              {errors.company && <div className="text-red-600 text-xs mt-1">{errors.company}</div>}
            </div>
            <div className="mb-4">
              <label className="block mb-2">NID</label>
              <input type="text" name="nid" className="border rounded px-4 py-2 w-full" placeholder="Enter NID" title="NID" defaultValue={isEdit ? initialData?.nid : ""} />
              {errors.nid && <div className="text-red-600 text-xs mt-1">{errors.nid}</div>}
            </div>
            <div className="mb-4 col-span-3">
              <label className="block mb-2">Note</label>
              <textarea name="note" className="border rounded px-4 py-2 w-full" rows={3} placeholder="Enter note" title="Note" defaultValue={isEdit ? initialData?.note : ""}></textarea>
              {errors.note && <div className="text-red-600 text-xs mt-1">{errors.note}</div>}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Status</label>
              <select name="status" className="border rounded px-4 py-2 w-full" defaultValue={isEdit ? initialData?.status : "Active"} title="Status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.status && <div className="text-red-600 text-xs mt-1">{errors.status}</div>}
            </div>
          </div>
          <div className="flex justify-end">
            {isEdit ? (
              <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded mr-2" onClick={onClose}>Cancel</button>
            ) : (
              <button type="reset" className="bg-gray-500 text-white px-4 py-2 rounded mr-2">Reset</button>
            )}
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitorFormModal;
