"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import '@/lib/polyfills';

const FaceCaptureModal = dynamic(
  () => import('./FaceCaptureModal'),
  { ssr: false }
);

interface ClientFaceCaptureProps {
  open: boolean;
  visitorName: string;
  onClose: () => void;
  onSave: (blob: Blob) => void;
  initialImageUrl?: string;
}

export default function ClientFaceCapture(props: ClientFaceCaptureProps) {
  return <FaceCaptureModal {...props} />;
}