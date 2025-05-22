"use client";

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import toast from 'react-hot-toast';

interface WebcamModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (image: string) => void;
  visitorName: string;
}

const WebcamModal: React.FC<WebcamModalProps> = ({ open, onClose, onCapture, visitorName }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasValidDetection, setHasValidDetection] = useState(false);
  const detectionRef = useRef<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection; }>[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.load('/models'),
          faceapi.nets.faceLandmark68Net.load('/models'),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
        toast.error('Failed to load face detection models');
      }
    };

    if (open) {
      loadModels();
    }

    return () => {
      setModelsLoaded(false);
      setIsVideoReady(false);
      setHasValidDetection(false);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !modelsLoaded || !isVideoReady || !webcamRef.current?.video) return;

    let frameId: number;
    const video = webcamRef.current.video;
    const canvas = canvasRef.current;

    const detectFace = async () => {
      if (!canvas || video.readyState !== 4) return;

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detection) {
          const dims = { width: video.videoWidth, height: video.videoHeight };
          const resized = faceapi.resizeResults(detection, dims);
          
          if (isValidDetection(resized)) {
            detectionRef.current = [resized];
            setHasValidDetection(true);
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              faceapi.draw.drawDetections(canvas, [resized]);
              faceapi.draw.drawFaceLandmarks(canvas, [resized]);
            }
          }
        } else {
          setHasValidDetection(false);
        }
      } catch (error) {
        console.error('Detection error:', error);
      }

      frameId = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [open, modelsLoaded, isVideoReady]);

  const isValidDetection = (detection: any) => {
    if (!detection?.detection?.box) return false;
    const { x, y, width, height } = detection.detection.box;
    return (
      typeof x === 'number' && !isNaN(x) &&
      typeof y === 'number' && !isNaN(y) &&
      typeof width === 'number' && !isNaN(width) &&
      typeof height === 'number' && !isNaN(height)
    );
  };

  const handleCapture = () => {
    if (!webcamRef.current || !hasValidDetection) {
      toast.error('Please wait for face detection');
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Capture Photo - {visitorName}</h2>
        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            width={640}
            height={480}
            screenshotFormat="image/jpeg"
            className="rounded"
            onUserMedia={() => setIsVideoReady(true)}
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user"
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            width={640}
            height={480}
            style={{ width: '640px', height: '480px' }}
          />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleCapture}
            disabled={!hasValidDetection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Capture
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebcamModal;