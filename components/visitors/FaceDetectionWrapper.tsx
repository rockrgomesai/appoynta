"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import { Toaster } from 'react-hot-toast';

// Dynamically import WebcamModal with no SSR
const WebcamModal = dynamic(
  () => import('./WebcamModal'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">Loading camera...</div>
      </div>
    )
  }
);

interface FaceDetectionWrapperProps {
  open: boolean;
  onClose: () => void;
  onCapture: (image: string) => void;
  visitorName: string;
}

const FaceDetectionWrapper: React.FC<FaceDetectionWrapperProps> = (props) => {
  return (
    <>
      <Toaster position="top-right" />
      <WebcamModal {...props} />
    </>
  );
};

export default FaceDetectionWrapper;