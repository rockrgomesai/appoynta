"use client";

import dynamic from 'next/dynamic';

const FaceRecognitionModal = dynamic(
  () => import('./FaceRecognitionModal'),
  { ssr: false }
);

interface Props {
  open: boolean;
  visitors: any[];
  onClose: () => void;
  onMatch: (visitor: any) => void;
}

export default function ClientFaceRecognitionModal(props: Props) {
  return <FaceRecognitionModal {...props} />;
}