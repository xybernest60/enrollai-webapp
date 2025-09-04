"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { EnrollmentData } from "./enrollment-wizard";
import { Camera, Loader2, UserCheck, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFaceScanFeedback } from "@/ai/flows/face-scan-feedback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";

type FaceApi = typeof import("@vladmandic/face-api");

type FaceScanStepProps = {
  data: EnrollmentData;
  updateData: (data: Partial<EnrollmentData>) => void;
  next: () => void;
  back: () => void;
};

type ScanStatus = "idle" | "scanning" | "success" | "error";

export function FaceScanStep({ updateData, next, back }: FaceScanStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [faceapi, setFaceApi] = useState<FaceApi | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [feedback, setFeedback] = useState("Initializing camera...");
  const feedbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadFaceApi = async () => {
      const api = await import("@vladmandic/face-api");
      api.env.monkeyPatch({
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        ImageData: ImageData,
        Video: HTMLVideoElement,
        createCanvasElement: () => document.createElement("canvas"),
        createImageElement: () => document.createElement("img"),
      });
      setFaceApi(api);
    };
    loadFaceApi();
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      if (!faceapi) return;
      const MODEL_URL = "/models";
      try {
        console.log("Loading face-api models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        setIsModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face-api models:", error);
        toast({
          title: "Model Loading Failed",
          description: "Could not load face recognition models. See instructions in /public/models/README.md.",
          variant: "destructive",
          duration: 10000,
        });
      }
    };
    loadModels();
  }, [faceapi, toast]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    if (feedbackIntervalRef.current) {
      clearInterval(feedbackIntervalRef.current);
    }
  }, [stream]);
  
  const startCamera = useCallback(async () => {
    stopCamera(); // Ensure previous stream is stopped
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setFeedback("Could not access camera. Please grant permission.");
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please grant permission.",
        variant: "destructive",
      });
    }
  }, [toast, stopCamera]);

  useEffect(() => {
    if (isModelsLoaded) {
      startCamera();
    }
    return () => {
      stopCamera();
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, [isModelsLoaded, startCamera, stopCamera]);

  const getRealTimeFeedback = useCallback(async () => {
    if (!videoRef.current || !faceapi || videoRef.current.readyState < 3 || scanStatus !== 'idle') return;

    const video = videoRef.current;
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

    let faceDetected = detections.length > 0;
    let distanceStatus = 'optimal';
    if(faceDetected) {
      const { width, height } = detections[0].box;
      const faceSize = (width + height) / 2;
      if (faceSize > 350) distanceStatus = 'too close';
      if (faceSize < 200) distanceStatus = 'too far';
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = ctx?.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
    let brightness = 0;
    if (imageData) {
        for (let i = 0; i < imageData.length; i += 4) {
            brightness += (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        }
        brightness = brightness / (imageData.length / 4);
    }
    const lightingStatus = brightness < 70 ? 'poor' : 'good';
    
    try {
        const { feedbackMessage } = await getFaceScanFeedback({ faceDetected, lightingStatus, distanceStatus });
        setFeedback(feedbackMessage);
    } catch (error) {
        console.error("Error getting feedback:", error);
    }
  }, [faceapi, scanStatus]);

  useEffect(() => {
    if(isModelsLoaded && stream && scanStatus === 'idle') {
        feedbackIntervalRef.current = setInterval(getRealTimeFeedback, 2000);
    } else {
        if(feedbackIntervalRef.current) clearInterval(feedbackIntervalRef.current);
    }
    return () => {
        if(feedbackIntervalRef.current) clearInterval(feedbackIntervalRef.current);
    }
  }, [isModelsLoaded, stream, scanStatus, getRealTimeFeedback]);


  const handleCapture = async () => {
    if (!videoRef.current || !isModelsLoaded || !faceapi) return;
    setScanStatus("scanning");
    setFeedback("Capturing face... Hold still.");
    if (feedbackIntervalRef.current) clearInterval(feedbackIntervalRef.current);

    const video = videoRef.current;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 1) {
        const embeddings = Array.from(detections[0].descriptor);
        updateData({ faceEmbeddings: embeddings });
        setScanStatus("success");
        setFeedback("Face scan captured successfully!");
        toast({
          title: "Face Scan Captured!",
          description: "Face embeddings have been generated successfully.",
        });
        stopCamera();
      } else {
        throw new Error(detections.length > 1 ? 'Multiple faces detected.' : 'No face detected.');
      }
    } catch (e) {
      console.error("Error during face detection:", e);
      setScanStatus("error");
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setFeedback(`Scan Failed: ${errorMessage}`);
      toast({
        title: "Scan Failed",
        description: `Could not capture a clear face. ${errorMessage}`,
        variant: "destructive",
      });
      // Restart camera for retry
      captureTimeoutRef.current = setTimeout(() => {
        setScanStatus('idle');
        startCamera();
      }, 3000);
    }
  };

  const renderOverlay = () => {
    return (
      <AnimatePresence>
        {scanStatus === "scanning" && (
           <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10"
          >
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="mt-4 text-lg font-semibold">Scanning...</p>
          </motion.div>
        )}
        {scanStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center text-white z-10"
          >
            <UserCheck className="h-16 w-16" />
            <p className="mt-2 text-xl font-bold">Captured!</p>
          </motion.div>
        )}
         {scanStatus === "error" && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center text-white z-10"
          >
            <ShieldAlert className="h-16 w-16" />
            <p className="mt-2 text-xl font-bold">Scan Failed</p>
            <p className="text-sm mt-1">{feedback}</p>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl font-semibold font-headline">Face Scan</h2>
      <p className="text-muted-foreground mt-1">
        Position your face inside the frame and press capture.
      </p>
      <div className="relative mt-6 w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden border">
        {renderOverlay()}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-80 border-4 border-white/50 border-dashed rounded-lg" />
        </div>
         {scanStatus === "scanning" && (
           <div className="absolute inset-x-0 top-0 h-1 bg-blue-500 animate-[scan_1.5s_ease-in-out_infinite]" />
        )}

      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={feedback}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-4 w-full max-w-md"
        >
          {scanStatus !== 'success' && (
             <Alert variant={scanStatus === 'error' ? 'destructive' : 'default'} className="text-left">
                <AlertTitle>{scanStatus === 'error' ? 'Error' : 'Live Feedback'}</AlertTitle>
                <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          )}
        </motion.div>
      </AnimatePresence>

      <Button
        onClick={handleCapture}
        disabled={!isModelsLoaded || scanStatus !== "idle"}
        className="mt-4"
      >
        {!isModelsLoaded ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <Camera className="mr-2 h-4 w-4" />
        )}
        {isModelsLoaded ? (scanStatus === 'idle' ? 'Start Scan' : 'Scanning...') : "Loading Models..."}
      </Button>

      <div className="mt-6 flex w-full max-w-sm gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => { stopCamera(); back(); }}
          className="w-full"
          disabled={scanStatus === 'scanning'}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={next}
          disabled={scanStatus !== "success"}
          className="w-full"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
