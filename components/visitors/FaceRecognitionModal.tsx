"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

interface Visitor {
  id: number;
  name: string;
  face_descriptors: number[];
}

interface FaceRecognitionModalProps {
  open: boolean;
  visitors: Visitor[];
  onClose: () => void;
  onMatch: (visitor: Visitor) => void;
}

const MODEL_URL = "/models";

export default function FaceRecognitionModal({
  open,
  visitors,
  onClose,
  onMatch
}: FaceRecognitionModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        console.log("Face-api models loaded successfully");
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face-api models:", error);
      }
    };

    loadModels();
  }, [open]);

  useEffect(() => {
    if (!open || !modelsLoaded) return;

    let stream: MediaStream | null = null;
    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    startVideo();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, modelsLoaded]);

  useEffect(() => {
    if (!open || !modelsLoaded || !videoRef.current) return;

    let isActive = true;
    const processFrame = async () => {
      if (!videoRef.current || isProcessing) return;

      try {
        setIsProcessing(true);
        const detection = await faceapi
          .detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection && isActive) {
          console.log("Face detected, comparing with", visitors.length, "visitors");
          const queryDescriptor = detection.descriptor;
          
          let bestMatch: Visitor | null = null;
          let bestDistance = 0.6; // Threshold for face matching

          for (const visitor of visitors) {
            if (!visitor.face_descriptors) continue;
            
            const distance = faceapi.euclideanDistance(
              queryDescriptor,
              new Float32Array(visitor.face_descriptors)
            );

            console.log(`Distance for ${visitor.name}:`, distance);
            
            if (distance < bestDistance) {
              bestDistance = distance;
              bestMatch = visitor;
            }
          }

          if (bestMatch) {
            console.log("Match found:", bestMatch.name, "with distance:", bestDistance);
            onMatch(bestMatch);
          }
        }
      } catch (error) {
        console.error("Error processing face:", error);
      } finally {
        setIsProcessing(false);
      }
    };

    const interval = setInterval(processFrame, 1000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [open, modelsLoaded, visitors, onMatch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">Face Recognition</h2>
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width={640}
            height={480}
            className="rounded-lg"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}