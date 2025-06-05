"use client";

// ...existing imports...
import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Visitor } from "@/types/visitor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faRemove,
  faEye,
  faAngleDoubleLeft,
  faAngleLeft,
  faAngleRight,
  faAngleDoubleRight,
  faFaceLaugh,
  faCamera, // Add this import
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";
import VisitorsTable from "@/components/visitors/VisitorsTable";
import Pagination from "@/components/visitors/Pagination";
import VisitorFormModal from "@/components/visitors/VisitorFormModal";
import VisitorViewModal from "@/components/visitors/VisitorViewModal";
import ClientFaceCapture from '@/components/visitors/ClientFaceCapture';

function VisitorPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceVisitor, setFaceVisitor] = useState<Visitor | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [activeVisitor, setActiveVisitor] = useState<Visitor | null>(null);
  const [isFaceCaptureOpen, setIsFaceCaptureOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>("id"); // Default to "id"
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // Default to "desc" for newest first

  // Fetch visitors
  const fetchVisitors = async () => {
    try {
      const response = await axiosInstance.get("/visitors", {
        params: {
          page: currentPage,
          pageSize,
          search: searchTerm,
          sortColumn: sortColumn || "id",
          sortOrder: sortOrder || "desc",
        },
      });
      setVisitors(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to fetch visitors");
      console.error("Failed to fetch visitors:", error);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [currentPage, pageSize, searchTerm, sortColumn, sortOrder]);

  // Handle Add Visitor
  const handleAddVisitor = async (visitorData: Omit<Visitor, "id">) => {
    try {
      await axiosInstance.post("/visitors", visitorData);
      toast.success("Visitor added successfully");
      
      // Reset to first page and ensure proper sorting for new records
      setCurrentPage(1);
      setSortColumn("id");
      setSortOrder("desc");
      
      fetchVisitors();
      setIsAddFormOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to add visitor");
      console.error("Failed to add visitor:", error);
    }
  };

  // Handle Edit Visitor
  const handleEditVisitor = async (visitorData: Visitor) => {
    try {
      await axiosInstance.patch(`/visitors/${visitorData.id}`, visitorData);
      fetchVisitors();
      setIsEditFormOpen(false);
      toast.success("Visitor updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to edit visitor");
      console.error("Failed to edit visitor:", error);
    }
  };

  // Handle Delete Visitor
  const handleDeleteVisitor = async (visitorId: number) => {
    if (confirm("Are you sure you want to delete this visitor?")) {
      try {
        await axiosInstance.delete(`/visitors/${visitorId}`);
        fetchVisitors();
        toast.success("Visitor deleted successfully");
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to delete visitor");
        console.error("Failed to delete visitor:", error);
      }
    }
  };

  const handleFaceClick = (visitor: Visitor) => {
    console.log('Face icon clicked for visitor:', visitor);
    setFaceVisitor(visitor);
    setIsFaceModalOpen(true);
  };

  const handleSaveFacePhoto = async (imageBlob: Blob) => {
    if (!faceVisitor) return;
    setIsUploading(true);
    try {
      const fileName = `visitor_${faceVisitor.id}_${Date.now()}.png`;
      const formData = new FormData();
      formData.append("file", imageBlob, fileName);
      await axiosInstance.post("/desk/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await axiosInstance.patch(`/visitors/${faceVisitor.id}`, { image_pp: fileName });
      toast.success("Photo saved and visitor updated!");
      fetchVisitors();
      setIsFaceModalOpen(false);
      setFaceVisitor(null);
    } catch (error: any) {
      toast.error("Failed to save photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraClick = (visitor: Visitor) => {
    console.log('Camera clicked for visitor:', visitor);
    setActiveVisitor(visitor);
    setIsFaceCaptureOpen(true);
  };

  function handlePhotoCapture(image: string): void {
    if (!activeVisitor) return;
    fetch(image)
      .then(res => res.blob())
      .then(blob => {
        handleSaveFacePhoto(blob);
        setIsWebcamOpen(false);
      })
      .catch(() => {
        toast.error("Failed to process captured photo");
      });
  }

  const handlePhotoCaptureBlob = async (blob: Blob) => {
    if (!activeVisitor) {
      toast.error('No visitor selected');
      return;
    }

    try {
      const faceapi = await import('@vladmandic/face-api');

      const imageFormData = new FormData();
      imageFormData.append('file', blob, `visitor_${activeVisitor.id}_${Date.now()}.jpg`);
      imageFormData.append('visitorId', activeVisitor.id!.toString());

      const imageResponse = await axiosInstance.post('/desk/image', imageFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (imageResponse.status < 200 || imageResponse.status >= 300) {
        throw new Error('Failed to save image');
      }

      const { imagePath } = await imageResponse.data;

      const faceFormData = new FormData();
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error("Failed to get canvas context");
        return;
      }
      ctx.drawImage(imageBitmap, 0, 0);
      const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      const detection = await faceapi.detectSingleFace(canvas, detectionOptions).withFaceLandmarks().withFaceDescriptor();
      if (!detection) {
        toast.error("No face detected!");
        return;
      }
      const descriptorArray = Array.from(detection.descriptor);
      faceFormData.append('descriptor', JSON.stringify(descriptorArray));
      faceFormData.append('image', blob);
      if (activeVisitor.id === undefined || activeVisitor.id === null) {
        toast.error('Visitor ID is missing');
        return;
      }
      faceFormData.append('visitorId', activeVisitor.id.toString());

      await axiosInstance.post('/desk/face', faceFormData);

      await axiosInstance.patch(`/visitors/${activeVisitor.id}`, {
        image_pp: imagePath
      });

      toast.success('Photo and face descriptor saved successfully');
      setIsFaceCaptureOpen(false);
      fetchVisitors();
    } catch (error) {
      console.error('Error saving photo:', error);
      toast.error('Failed to save photo and face descriptor');
    }
  };

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-blue-500 font-extrabold">Visitors</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search visitors..."
            className="border rounded px-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="button"
            title="Add Visitor"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={() => setIsAddFormOpen(true)}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Visitors Table */}
      <VisitorsTable
        visitors={visitors}
        onView={(visitor) => {
          setSelectedVisitor(visitor);
          setIsViewDialogOpen(true);
        }}
        onEdit={(visitor) => {
          setSelectedVisitor(visitor);
          setIsEditFormOpen(true);
        }}
        onDelete={handleDeleteVisitor}
        onCameraClick={handleCameraClick}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Add, Edit, and View Dialogs */}
      <VisitorFormModal
        open={isAddFormOpen}
        mode="add"
        onClose={() => setIsAddFormOpen(false)}
        onSubmit={handleAddVisitor}
      />
      <VisitorFormModal
        open={isEditFormOpen && !!selectedVisitor}
        mode="edit"
        initialData={selectedVisitor}
        onClose={() => setIsEditFormOpen(false)}
        onSubmit={handleEditVisitor}
      />
      <VisitorViewModal
        open={isViewDialogOpen && !!selectedVisitor}
        visitor={selectedVisitor}
        onClose={() => setIsViewDialogOpen(false)}
      />

      <ClientFaceCapture
        open={isFaceCaptureOpen}
        visitorName={activeVisitor?.name || ''}
        onClose={() => setIsFaceCaptureOpen(false)}
        onSave={handlePhotoCaptureBlob}
        initialImageUrl={activeVisitor?.image_pp}
      />
    </div>
  );
}

export default VisitorPage;