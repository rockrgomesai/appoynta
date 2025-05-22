import React, { useRef, useState, useEffect } from "react";
import * as faceapi from '@vladmandic/face-api';

interface FaceCaptureModalProps {
  open: boolean;
  visitorName: string;
  onClose: () => void;
  onSave: (imageBlob: Blob) => void;
  initialImageUrl?: string;
}

const FaceCaptureModal: React.FC<FaceCaptureModalProps> = ({ open, visitorName, onClose, onSave, initialImageUrl }) => {
  console.log('FaceCaptureModal rendered. open:', open, 'visitorName:', visitorName);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // Overlay for faceapi
  const captureCanvasRef = useRef<HTMLCanvasElement>(null); // Hidden for photo capture
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImageUrl || null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    if (open) {
      setCapturedImage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Load face-api.js models from /models
    const loadModels = async () => {
      await faceapi.nets.ssdMobilenetv1.load('/models/');
      await faceapi.nets.faceLandmark68Net.load('/models/');
      await faceapi.nets.faceRecognitionNet.load('/models/');
      await faceapi.nets.faceExpressionNet.load('/models/');
      setModelsLoaded(true);
    };
    loadModels();
  }, [open]);

  useEffect(() => {
    if (!open || !modelsLoaded) return;
    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!video || !overlayCanvas) return;
    let animationFrameId: number;

    const detect = async () => {
      if (video.readyState === 4) {
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
        try {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks();
          const results = faceapi.resizeResults(detections, { width: video.videoWidth, height: video.videoHeight });
          const ctx = overlayCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            // Debug: draw a red border to prove canvas is visible
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, overlayCanvas.width, overlayCanvas.height);

            if (results.length === 0) {
              ctx.font = '24px Arial';
              ctx.fillStyle = 'red';
              ctx.fillText('No face detected', 20, 40);
            } else {
              results.forEach(res => {
                new faceapi.draw.DrawBox(res.detection.box, { label: 'Face' }).draw(overlayCanvas);
                faceapi.draw.drawFaceLandmarks(overlayCanvas, [res]);
              });
            }
          }
        } catch (err) {
          console.error('Face detection error:', err);
        }
      }
      animationFrameId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [open, modelsLoaded]);

  useEffect(() => {
    if (open && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then((mediaStream) => {
          setStream(mediaStream);
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
          }
        })
        .catch(() => {
          // handle error
        });
    }
    return () => {
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setStream(null);
    };
    // eslint-disable-next-line
  }, [open]);

  const handleTakePhoto = () => {
    if (videoRef.current && captureCanvasRef.current) {
      const ctx = captureCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        const dataUrl = captureCanvasRef.current.toDataURL("image/png");
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleSavePhoto = () => {
    if (!capturedImage) return;
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => onSave(blob));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* DEBUG: Modal is rendering */}
      <div className="absolute top-0 left-0 bg-yellow-200 text-black px-2 py-1 z-50">DEBUG: FaceCaptureModal open={String(open)} visitorName={visitorName}</div>
      <div className="absolute inset-0 bg-gray-500/50" onClick={onClose}></div>
      <div className="relative bg-white p-8 rounded shadow-lg w-[1400px] flex flex-col z-10">
        <button
          type="button"
          title="Close"
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >✕</button>
        <h2 className="text-2xl font-bold mb-6">Capture Face Photo for {visitorName}</h2>
        <div className="flex gap-8">
          {/* Webcam Card */}
          <div className="flex flex-col items-center">
            <div className="w-[640px] h-[480px] rounded border mb-2 bg-black flex items-center justify-center overflow-hidden relative">
              <video ref={videoRef} width={640} height={480} className="w-full h-full object-cover" />
              {/* Overlay canvas for faceapi feedback */}
              <canvas ref={overlayCanvasRef} width={640} height={480} className="absolute top-0 left-0 w-full h-full" />
            </div>
            <button
              type="button"
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleTakePhoto}
              disabled={isTakingPhoto}
            >Take Photo</button>
          </div>
          {/* Preview Card */}
          <div className="flex flex-col items-center">
            {/* Hidden canvas for photo capture only */}
            <canvas ref={captureCanvasRef} width={640} height={480} className="hidden" />
            <div className="w-[640px] h-[480px] rounded border mb-2 bg-gray-200 flex items-center justify-center overflow-hidden">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No photo taken</div>
              )}
            </div>
            <button
              type="button"
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleSavePhoto}
              disabled={!capturedImage}
            >Save Photo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceCaptureModal;
