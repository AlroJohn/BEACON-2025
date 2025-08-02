"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Camera,
  X,
  Check,
  AlertCircle,
  Loader2,
  UserCheck,
  RotateCcw,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as faceapi from "face-api.js";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FaceCaptureWithUploadProps {
  onCapture: (imageUrl: string) => void;
  capturedImageUrl?: string;
  userId?: string; // For generating unique file names
}

// Hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

export function FaceCaptureWithUpload({
  onCapture,
  capturedImageUrl,
  userId,
}: FaceCaptureWithUploadProps) {
  // State management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(
    capturedImageUrl || null
  );
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);
  const [isValidFace, setIsValidFace] = useState(false);

  // Refs
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = useIsMobile();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      if (typeof window === "undefined") return;

      try {
        setIsModelLoading(true);
        setModelLoadProgress(0);

        const modelBaseUrl = "/models";

        // Load models progressively
        await Promise.all([
          faceapi.nets.tinyFaceDetector
            .loadFromUri(modelBaseUrl)
            .then(() => setModelLoadProgress(25)),
          faceapi.nets.faceLandmark68Net
            .loadFromUri(modelBaseUrl)
            .then(() => setModelLoadProgress(50)),
          faceapi.nets.faceRecognitionNet
            .loadFromUri(modelBaseUrl)
            .then(() => setModelLoadProgress(75)),
          faceapi.nets.faceExpressionNet
            .loadFromUri(modelBaseUrl)
            .then(() => setModelLoadProgress(100)),
        ]);

        console.log("Face detection models loaded successfully");
      } catch (err) {
        console.error("Error loading face detection models:", err);
        setError(
          "Failed to load face detection models. Face verification may not work optimally."
        );
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModels();
  }, []);

  // Face detection function
  const detectFace = useCallback(async () => {
    if (!webcamRef.current?.video || !canvasRef.current) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;

    if (video.readyState !== 4) return;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        const detection = detections[0];
        setFaceDetected(true);

        // Calculate quality score based on detection confidence and face size
        const faceBox = detection.detection.box;
        const faceArea = faceBox.width * faceBox.height;
        const totalArea = displaySize.width * displaySize.height;
        const faceRatio = faceArea / totalArea;

        // Quality scoring (0-100)
        const confidenceScore = detection.detection.score * 100;
        const sizeScore = Math.min(faceRatio * 500, 100); // Optimal face size around 20% of frame
        const qualityScore = Math.round((confidenceScore + sizeScore) / 2);

        setQualityScore(qualityScore);
        setIsValidFace(qualityScore > 60 && detections.length === 1);

        // Draw detection box
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.strokeStyle = qualityScore > 60 ? "#10b981" : "#f59e0b";
          ctx.lineWidth = 3;
          ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);

          // Draw quality indicator
          ctx.fillStyle = qualityScore > 60 ? "#10b981" : "#f59e0b";
          ctx.font = "16px Arial";
          ctx.fillText(`Quality: ${qualityScore}%`, faceBox.x, faceBox.y - 10);
        }
      } else {
        setFaceDetected(false);
        setQualityScore(0);
        setIsValidFace(false);
      }
    } catch (err) {
      console.error("Face detection error:", err);
    }
  }, []);

  // Start face detection when dialog opens
  useEffect(() => {
    if (isDialogOpen && !isModelLoading) {
      detectionIntervalRef.current = setInterval(detectFace, 100);
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isDialogOpen, isModelLoading, detectFace]);

  // Upload image to Supabase
  const uploadImageToSupabase = async (
    base64Image: string
  ): Promise<string> => {
    try {
      // Remove data:image/jpeg;base64, prefix
      const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

      // Convert base64 to buffer
      const imageBuffer = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0)
      );

      // Generate unique file name with sanitized userId
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const sanitizedUserId = userId
        ? userId.replace(/[^a-zA-Z0-9-_]/g, "-")
        : uuidv4();
      const fileName = `${sanitizedUserId}/face-scan-${timestamp}.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("user-profile")
        .upload(fileName, imageBuffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("user-profile")
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  // Capture photo with upload
  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || !isValidFace) return;

    try {
      setIsCapturing(true);
      setError(null);

      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
      });

      if (!imageSrc) {
        throw new Error("Failed to capture image");
      }

      // Upload to Supabase
      setIsUploading(true);
      const uploadedUrl = await uploadImageToSupabase(imageSrc);

      // Update state and call parent callback
      setCapturedImage(uploadedUrl);
      onCapture(uploadedUrl);
      setIsDialogOpen(false);

      console.log(
        "Face image captured and uploaded successfully:",
        uploadedUrl
      );
    } catch (err) {
      console.error("Face capture error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to capture and upload image"
      );
    } finally {
      setIsCapturing(false);
      setIsUploading(false);
    }
  }, [isValidFace, onCapture, userId]);

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    setIsDialogOpen(true);
  };

  // Get webcam constraints based on device
  const getWebcamConstraints = () => {
    const baseConstraints = {
      width: isMobile ? 480 : 640,
      height: isMobile ? 640 : 480,
      facingMode: "user",
    };

    return {
      video: baseConstraints,
      audio: false,
    };
  };

  return (
    <div className="space-y-4">
      {/* Capture Status */}
      {capturedImage ? (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Face captured successfully
              </p>
              <p className="text-xs text-green-600">
                Your identity has been verified and uploaded
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retakePhoto}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Face verification required
              </p>
              <p className="text-xs text-blue-600">
                Click to capture your photo for identity verification
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center space-x-2"
          >
            <Camera className="h-4 w-4" />
            <span>Capture Face</span>
          </Button>
        </div>
      )}

      {/* Face Capture Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Face Verification</span>
            </DialogTitle>
            <DialogDescription>
              Position your face within the frame for identity verification.
              We'll upload your photo securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Model Loading Progress */}
            {isModelLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Loading face detection models...</span>
                  <span>{modelLoadProgress}%</span>
                </div>
                <Progress value={modelLoadProgress} className="h-2" />
              </div>
            )}

            {/* Camera Feed */}
            <div className="relative">
              <div className="relative mx-auto max-w-md">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  videoConstraints={getWebcamConstraints().video}
                  onUserMedia={() => console.log("Camera started")}
                  onUserMediaError={(err) => {
                    console.error("Camera error:", err);
                    setError(
                      "Unable to access camera. Please check permissions."
                    );
                  }}
                  className="w-full rounded-lg"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />

                {/* Face Detection Overlay */}
                <div className="absolute top-2 left-2 right-2 flex justify-between">
                  <Badge
                    variant={faceDetected ? "default" : "secondary"}
                    className="bg-black/75 text-white"
                  >
                    {faceDetected ? "Face Detected" : "No Face"}
                  </Badge>

                  {faceDetected && (
                    <Badge
                      variant={isValidFace ? "default" : "secondary"}
                      className={`${
                        isValidFace ? "bg-green-600" : "bg-yellow-600"
                      } text-white`}
                    >
                      Quality: {qualityScore}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Device Recommendations */}
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                {isMobile ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                <span>{isMobile ? "Mobile" : "Desktop"} Mode</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isCapturing || isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={capturePhoto}
                disabled={
                  !isValidFace || isCapturing || isUploading || isModelLoading
                }
                className="flex items-center space-x-2"
              >
                {isCapturing || isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>
                  {isUploading
                    ? "Uploading..."
                    : isCapturing
                    ? "Capturing..."
                    : "Capture & Upload"}
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
