
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera,
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

// Dynamically import face-api.js
type FaceApi = typeof import("@vladmandic/face-api");

type CheckInStatus =
  | "idle"
  | "checking_rfid"
  | "prompting_face_scan"
  | "verifying_face"
  | "success"
  | "error_face_mismatch"
  | "error_rfid_not_found"
  | "error_no_active_session";

type StudentInfo = { id: string; name: string; face_embedding: number[] | null; image_url: string | null };
type ActiveSession = { id: string, name: string };

export function CheckInForm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [rfid, setRfid] = useState("");
  const [status, setStatus] = useState<CheckInStatus>("idle");
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [faceapi, setFaceApi] = useState<FaceApi | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const { toast } = useToast();

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
        ]);
        setIsModelsLoaded(true);
        console.log("Face-api models loaded successfully.");
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

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast({
          title: "Camera Error",
          description: "Could not access the camera. Please check permissions.",
          variant: "destructive",
        });
      }
    };
    if (isModelsLoaded) {
      startCamera();
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [isModelsLoaded, toast]);
  
  const resetState = useCallback(() => {
    setStatus("idle");
    setRfid("");
    setStudent(null);
    setActiveSession(null);
    setTimeout(() => rfidInputRef.current?.focus(), 100);
  }, []);

  const handleRfidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfid) return;
    setStatus("checking_rfid");

    const { data: studentData, error: rfidError } = await supabase
      .from("students")
      .select("id, name, face_embedding, image_url, enrollments(classes(id))")
      .eq("rfid_uid", rfid.trim())
      .single();

    if (rfidError || !studentData) {
      console.log("RFID not found:", rfidError?.message || 'No student data returned');
      setStatus("error_rfid_not_found");
      setTimeout(resetState, 4000);
      return;
    }

    setStudent(studentData);
    
    // Find active session
    const enrolledClassIds = studentData.enrollments.map((e: any) => e.classes.id);
    const now = new Date();
    const dayOfWeek = now.getDay();

    const { data: potentialSessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id, name, start_time, end_time')
      .in('class_id', enrolledClassIds)
      .eq('day_of_week', dayOfWeek);
    
    if (sessionError) {
        console.error("Error fetching potential sessions:", sessionError);
        setStatus("error_no_active_session");
        setTimeout(resetState, 4000);
        return;
    }
    
    const activeSession = potentialSessions.find(session => {
        // DB times are UTC, e.g. "1970-01-01T10:00:00+00:00"
        const startTime = new Date(session.start_time);
        const endTime = new Date(session.end_time);

        // Get the time part from the UTC timestamp
        const startHours = startTime.getUTCHours();
        const startMinutes = startTime.getUTCMinutes();
        const endHours = endTime.getUTCHours();
        const endMinutes = endTime.getUTCMinutes();

        // Create Date objects for today with the session's start and end times
        const sessionStartToday = new Date(now);
        sessionStartToday.setHours(startHours, startMinutes, 0, 0);
        
        const sessionEndToday = new Date(now);
        sessionEndToday.setHours(endHours, endMinutes, 0, 0);

        return now >= sessionStartToday && now <= sessionEndToday;
    });

    if (!activeSession) {
      console.log("No active session found for student.");
      setStatus("error_no_active_session");
      setTimeout(resetState, 4000);
      return;
    }

    setActiveSession(activeSession);

    if (!studentData.face_embedding || !Array.isArray(studentData.face_embedding)) {
      console.log(`Student ${studentData.name} has no face embedding. Checking in with RFID only.`);
      await recordAttendance(studentData.id, activeSession.id, false);
      return;
    }

    setStatus("prompting_face_scan");
  };

  const handleFaceScan = async () => {
    if (!videoRef.current || !faceapi || !isModelsLoaded || !student || !student.face_embedding || !activeSession) return;

    setStatus("verifying_face");

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 1) {
        const storedEmbeddings = new Float32Array(student.face_embedding);
        const labeledDescriptor = new faceapi.LabeledFaceDescriptors(student.name, [storedEmbeddings]);
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptor);
        const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);

        console.log(`Face match for ${student.name}:`, bestMatch.toString());

        if (bestMatch.label !== 'unknown' && bestMatch.distance < 0.6) {
          await recordAttendance(student.id, activeSession.id, true);
        } else {
          setStatus("error_face_mismatch");
          setTimeout(resetState, 4000);
        }
      } else {
        console.warn(`Expected 1 face, but found ${detections.length}. Retrying.`);
        toast({ title: "Scan Issue", description: "Could not get a clear face scan. Please hold still and try again.", variant: "destructive" });
        setStatus("prompting_face_scan"); // Go back to prompting
      }
    } catch (e) {
      console.error("Error during face verification:", e);
      setStatus("prompting_face_scan");
      toast({ title: "Scan Error", description: "An error occurred during face verification.", variant: "destructive" });
    }
  };

  const recordAttendance = async (studentId: string, sessionId: string, faceVerified: boolean) => {
    const { error: attendanceError } = await supabase.from("attendance").insert({
      student_id: studentId,
      session_id: sessionId,
      status: "present", // We can simplify this, but let's keep it for now.
      verified_by_face: faceVerified,
    });

    if (attendanceError) {
      console.error("Attendance Error:", attendanceError);
      toast({ title: "Error", description: `Could not record attendance: ${attendanceError.message}`, variant: "destructive" });
      setStatus("idle");
    } else {
      setStatus("success");
    }
    setTimeout(resetState, 3000);
  };

  const renderOverlay = () => {
    switch (status) {
      case "checking_rfid":
      case "verifying_face":
        return (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="mt-2">{status === "checking_rfid" ? "Checking Card..." : "Verifying Face..."}</p>
          </div>
        );
      case "success":
        return (
          <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center text-white text-center p-4">
            <ShieldCheck className="h-16 w-16" />
            <p className="mt-2 text-xl font-bold">Welcome, {student?.name}!</p>
            <p className="text-sm">Checked in for {activeSession?.name}.</p>
          </div>
        );
      case "error_face_mismatch":
        return (
          <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center text-white text-center p-4">
            <AlertTriangle className="h-16 w-16" />
            <p className="mt-2 text-xl font-bold">Face Not Recognized</p>
            <p className="text-sm">Please return the card to {student?.name}.</p>
          </div>
        );
       case "error_rfid_not_found":
        return (
          <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center text-white text-center p-4">
            <XCircle className="h-16 w-16" />
            <p className="mt-2 text-xl font-bold">Card Not Recognized</p>
            <p className="text-sm">Please contact your teacher for enrollment.</p>
          </div>
        );
      case "error_no_active_session":
        return (
          <div className="absolute inset-0 bg-yellow-500/80 flex flex-col items-center justify-center text-white text-center p-4">
            <AlertTriangle className="h-16 w-16" />
            <p className="mt-2 text-xl font-bold">No Active Session</p>
            <p className="text-sm">There is no active check-in session for you right now, {student?.name}.</p>
          </div>
        );
      case "prompting_face_scan":
         return (
          <div className="absolute inset-0 bg-blue-500/80 flex flex-col items-center justify-center text-white text-center p-4">
            <User className="h-16 w-16" />
            <p className="mt-2 text-xl font-bold">Hello, {student?.name}!</p>
            <p className="text-sm">Look at the camera for {activeSession?.name}.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const isRfidStep = status === 'idle' || status === 'checking_rfid' || status === 'error_rfid_not_found' || status === 'error_no_active_session';
  
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Student Check-In</CardTitle>
        <CardDescription>
          {isRfidStep ? "Tap your card to begin." : "Follow the instructions on screen."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
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
          {renderOverlay()}
        </div>
        
        {isRfidStep && (
          <form onSubmit={handleRfidSubmit}>
            <Label htmlFor="rfid">RFID UID</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="rfid"
                ref={rfidInputRef}
                placeholder="Tap your card..."
                value={rfid}
                onChange={(e) => setRfid(e.target.value)}
                disabled={status !== "idle" || !isModelsLoaded}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={status !== "idle" || !isModelsLoaded || !rfid}>
             {status === 'checking_rfid' ? <Loader2 className="animate-spin" /> : (isModelsLoaded ? 'Find Student & Session' : 'Loading Models...')}
            </Button>
          </form>
        )}
      </CardContent>

      {!isRfidStep && (
        <CardFooter>
          <Button onClick={handleFaceScan} className="w-full" disabled={status !== "prompting_face_scan"}>
            {status === "verifying_face" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Scan Face
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

    