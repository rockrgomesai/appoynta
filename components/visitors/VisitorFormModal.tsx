import React from "react";
import { Visitor } from "@/types/visitor";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema for visitor validation
const visitorSchema = z.object({
  name: z.string().min(2, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(11, "Phone number must be at least 11 digits").max(15, "Phone number too long"),
  whatsapp: z.enum(["Yes", "No"], { required_error: "WhatsApp field is required" }),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
  company: z.string().max(100, "Company name too long").optional().or(z.literal("")),
  nid: z.string().max(13, "NID too long").optional().or(z.literal("")),
  note: z.string().max(500, "Note too long").optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required" }),
});

type VisitorForm = z.infer<typeof visitorSchema>;

interface VisitorFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialData?: Visitor | null;
  onClose: () => void;
  onSubmit: (data: Omit<Visitor, "id"> | Visitor) => void;
}

const VisitorFormModal: React.FC<VisitorFormModalProps> = ({ 
  open, 
  mode, 
  initialData, 
  onClose, 
  onSubmit 
}) => {
  const isEdit = mode === "edit" && initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitorForm>({
    resolver: zodResolver(visitorSchema),
    defaultValues: isEdit ? {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      whatsapp: (initialData?.whatsapp as "Yes" | "No") || "No",
      gender: (initialData?.gender as "Male" | "Female" | "Other") || "Male",
      company: initialData?.company || "",
      nid: initialData?.nid || "",
      note: initialData?.note || "",
      status: (initialData?.status as "Active" | "Inactive") || "Active",
    } : {
      name: "",
      email: "",
      phone: "",
      whatsapp: "No",
      gender: "Male",
      company: "",
      nid: "",
      note: "",
      status: "Active",
    },
  });

  React.useEffect(() => {
    if (open && isEdit && initialData) {
      reset({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        whatsapp: (initialData.whatsapp as "Yes" | "No") || "No",
        gender: (initialData.gender as "Male" | "Female" | "Other") || "Male",
        company: initialData.company || "",
        nid: initialData.nid || "",
        note: initialData.note || "",
        status: (initialData.status as "Active" | "Inactive") || "Active",
      });
    } else if (open && !isEdit) {
      reset({
        name: "",
        email: "",
        phone: "",
        whatsapp: "No",
        gender: "Male",
        company: "",
        nid: "",
        note: "",
        status: "Active",
      });
    }
  }, [open, isEdit, initialData, reset]);

  if (!open) return null;

  const onFormSubmit = (data: VisitorForm) => {
    const submitData = isEdit 
      ? { ...data, id: initialData!.id }
      : data;
    onSubmit(submitData as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-500/50" onClick={onClose}></div>
      <div className="relative bg-white p-8 rounded shadow-lg w-3/4 max-w-4xl z-10 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          title="Close"
          aria-label="Close"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-blue-500">
          {isEdit ? "Edit Visitor" : "Add Visitor"}
        </h2>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid grid-cols-3 gap-6">
            <div className="mb-4">
              <label className="block mb-2">Name</label>
              <input 
                type="text" 
                {...register("name")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.name ? "border-red-500" : ""}`}
                placeholder="Enter name" 
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Email</label>
              <input 
                type="email" 
                {...register("email")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.email ? "border-red-500" : ""}`}
                placeholder="Enter email" 
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Phone</label>
              <input 
                type="text" 
                {...register("phone")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.phone ? "border-red-500" : ""}`}
                placeholder="Enter phone" 
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">WhatsApp</label>
              <select 
                {...register("whatsapp")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.whatsapp ? "border-red-500" : ""}`}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.whatsapp && (
                <p className="text-red-600 text-sm mt-1">{errors.whatsapp.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Gender</label>
              <select 
                {...register("gender")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.gender ? "border-red-500" : ""}`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-600 text-sm mt-1">{errors.gender.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Company</label>
              <input 
                type="text" 
                {...register("company")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.company ? "border-red-500" : ""}`}
                placeholder="Enter company" 
              />
              {errors.company && (
                <p className="text-red-600 text-sm mt-1">{errors.company.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">NID</label>
              <input 
                type="text" 
                {...register("nid")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.nid ? "border-red-500" : ""}`}
                placeholder="Enter NID" 
              />
              {errors.nid && (
                <p className="text-red-600 text-sm mt-1">{errors.nid.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Status</label>
              <select 
                {...register("status")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.status ? "border-red-500" : ""}`}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>
            
            <div className="mb-4 col-span-3">
              <label className="block mb-2">Note</label>
              <textarea 
                {...register("note")}
                className={`border border-gray-700 rounded px-4 py-2 w-full ${errors.note ? "border-red-500" : ""}`}
                rows={3} 
                placeholder="Enter note" 
              />
              {errors.note && (
                <p className="text-red-600 text-sm mt-1">{errors.note.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            {isEdit ? (
              <button 
                type="button" 
                className="bg-gray-500 text-white px-4 py-2 rounded mr-2" 
                onClick={onClose}
              >
                Cancel
              </button>
            ) : (
              <button 
                type="button" 
                className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                onClick={() => reset()}
              >
                Reset
              </button>
            )}
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={isSubmitting}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitorFormModal;
