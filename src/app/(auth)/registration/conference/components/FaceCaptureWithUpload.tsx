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
import * as faceapi from "face-api.js";
import { FaceCaptureInstructions } from "../../../../../components/reuseable/page-components/FaceCaptureInstructions";

interface FaceCaptureWithUploadProps {
  onCapture: (imageDataUrl: string) => void; // Now passes base64 data like visitor
  capturedImageUrl?: string;
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
}: FaceCaptureWithUploadProps) {
  const webcamRef = useRef<Webcam>(null);

  // Modal States
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Face Detection States
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [facePosition, setFacePosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [faceProperlyPositioned, setFaceProperlyPositioned] = useState(false);
  const [positioningFeedback, setPositioningFeedback] = useState<string>("");

  // Camera States
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const isMobile = useIsMobile();

  // Load Face Detection Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelLoadingProgress(30);
        console.log("Loading face detection models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelLoadingProgress(100);
        setModelsLoaded(true);
        console.log("Face detection models loaded successfully");
      } catch (error) {
        console.error("Error loading face detection models:", error);
        setModelsLoaded(false);
        setModelLoadingProgress(0);
      }
    };

    loadModels();
  }, []);

  // Face Detection Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (faceDetectionActive && modelsLoaded && webcamRef.current?.video) {
      interval = setInterval(
        async () => {
          try {
            const video = webcamRef.current?.video;
            if (!video || video.readyState !== 4) return;

            const detection = await faceapi.detectSingleFace(
              video,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: isMobile ? 0.5 : 0.3,
              })
            );

            if (detection) {
              const confidence = detection.score;
              setFaceConfidence(confidence);

              // Confidence threshold
              const confidenceThreshold = isMobile ? 0.7 : 0.3;
              if (confidence > confidenceThreshold) {
                const { x, y, width, height } = detection.box;
                setFacePosition({ x, y, width, height });

                // Check if face is properly positioned within the oval
                const { isProperlyPositioned, feedback } = checkFacePositioning(
                  { x, y, width, height },
                  video
                );

                setFaceDetected(true);
                setFaceProperlyPositioned(isProperlyPositioned);
                setPositioningFeedback(feedback);
              } else {
                setFaceDetected(false);
                setFaceProperlyPositioned(false);
                setPositioningFeedback("Face detection too weak");
                setFacePosition(null);
              }
            } else {
              setFaceDetected(false);
              setFaceConfidence(0);
              setFacePosition(null);
              setFaceProperlyPositioned(false);
              setPositioningFeedback("No face detected");
            }
          } catch (error) {
            console.error("Face detection error:", error);
            setFaceDetected(false);
            setFaceConfidence(0);
          }
        },
        isMobile ? 300 : 200
      );
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [faceDetectionActive, modelsLoaded, isMobile]);

  // Function to check if face is properly positioned within the oval guide
  const checkFacePositioning = useCallback(
    (
      faceBox: { x: number; y: number; width: number; height: number },
      videoElement: HTMLVideoElement
    ) => {
      if (!faceBox || !videoElement)
        return { isProperlyPositioned: false, feedback: "No face detected" };

      const videoRect = videoElement.getBoundingClientRect();
      const videoWidth = videoElement.videoWidth || videoRect.width;
      const videoHeight = videoElement.videoHeight || videoRect.height;

      // Define the oval guide dimensions - consistent with the 444x333 aspect ratio
      const ovalWidth = 230;
      const ovalHeight = 230;
      const ovalCenterX = videoWidth / 2;
      const ovalCenterY = videoHeight / 2;

      // Calculate face center and dimensions
      const faceCenterX = faceBox.x + faceBox.width / 2;
      const faceCenterY = faceBox.y + faceBox.height / 2;
      const faceWidth = faceBox.width;
      const faceHeight = faceBox.height;

      // Consistent tolerances across all devices
      const centerToleranceX = 120;
      const centerToleranceY = 100;

      // Consistent face size requirements across all devices
      const minFaceWidth = 80;
      const maxFaceWidth = 500; // Allow close-ups
      const minFaceHeight = 100;
      const maxFaceHeight = 550; // Allow close-ups

      // Check if face is reasonably centered
      const isCenteredX =
        Math.abs(faceCenterX - ovalCenterX) <= centerToleranceX;
      const isCenteredY =
        Math.abs(faceCenterY - ovalCenterY) <= centerToleranceY;

      // Check if face size is appropriate (more lenient for close-ups)
      const isGoodWidth =
        faceWidth >= minFaceWidth && faceWidth <= maxFaceWidth;
      const isGoodHeight =
        faceHeight >= minFaceHeight && faceHeight <= maxFaceHeight;

      // Check if face overlaps with oval (doesn't need to be completely inside)
      const faceLeft = faceBox.x;
      const faceRight = faceBox.x + faceBox.width;
      const faceTop = faceBox.y;
      const faceBottom = faceBox.y + faceBox.height;

      const ovalLeft = ovalCenterX - ovalWidth / 2;
      const ovalRight = ovalCenterX + ovalWidth / 2;
      const ovalTop = ovalCenterY - ovalHeight / 2;
      const ovalBottom = ovalCenterY + ovalHeight / 2;

      // Check if face overlaps with oval (more lenient than being completely inside)
      const hasXOverlap = faceRight > ovalLeft && faceLeft < ovalRight;
      const hasYOverlap = faceBottom > ovalTop && faceTop < ovalBottom;
      const overlapsOval = hasXOverlap && hasYOverlap;

      // Calculate overlap percentage for better feedback
      const overlapWidth =
        Math.min(faceRight, ovalRight) - Math.max(faceLeft, ovalLeft);
      const overlapHeight =
        Math.min(faceBottom, ovalBottom) - Math.max(faceTop, ovalTop);
      const overlapArea =
        Math.max(0, overlapWidth) * Math.max(0, overlapHeight);
      const faceArea = faceWidth * faceHeight;
      const overlapPercentage =
        faceArea > 0 ? (overlapArea / faceArea) * 100 : 0;

      // Generate feedback based on positioning
      let feedback = "";
      if (!overlapsOval) {
        if (!hasXOverlap && !hasYOverlap) {
          feedback = "Position your face in the oval area";
        } else if (!hasXOverlap) {
          feedback =
            faceCenterX < ovalCenterX
              ? "Move right into the oval"
              : "Move left into the oval";
        } else {
          feedback =
            faceCenterY < ovalCenterY
              ? "Move down into the oval"
              : "Move up into the oval";
        }
      } else if (overlapPercentage < 30) {
        feedback = "Center your face better in the oval";
      } else if (!isGoodWidth || !isGoodHeight) {
        if (faceWidth < minFaceWidth || faceHeight < minFaceHeight) {
          feedback = "Move closer to the camera";
        } else {
          feedback = "Perfect close-up! Ready to capture";
        }
      } else if (!isCenteredX || !isCenteredY) {
        if (!isCenteredX && !isCenteredY) {
          feedback = "Almost perfect! Center slightly";
        } else if (!isCenteredX) {
          feedback =
            faceCenterX < ovalCenterX
              ? "Shift slightly right"
              : "Shift slightly left";
        } else {
          feedback =
            faceCenterY < ovalCenterY
              ? "Shift slightly down"
              : "Shift slightly up";
        }
      } else {
        feedback = "Perfect! Ready to capture your close-up!";
      }

      // More lenient positioning requirements - face just needs to overlap oval reasonably
      const isProperlyPositioned =
        overlapsOval &&
        overlapPercentage >= 25 && // At least 25% of face in oval
        isGoodWidth &&
        isGoodHeight;

      return { isProperlyPositioned, feedback };
    },
    [isMobile]
  );

  // Process image to ensure high quality and consistent dimensions
  const captureImageAsFile = async (imageSrc: string): Promise<string> => {
    // Extract base64 data from the image source
    const base64Data = imageSrc.split(',')[1];
    if (!base64Data) return imageSrc;

    // Create a new image to load the captured photo
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Create a canvas with consistent desktop dimensions (444x333)
        const canvas = document.createElement('canvas');
        canvas.width = 444;
        canvas.height = 333;
        
        // Draw the image on the canvas with high quality settings
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Set high quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Calculate dimensions to maintain aspect ratio while filling the 444x333 area
          const sourceAspect = img.width / img.height;
          const targetAspect = 444 / 333;
          
          let sw, sh, sx, sy;
          
          if (sourceAspect > targetAspect) {
            // Source is wider than target, crop the width
            sh = img.height;
            sw = sh * targetAspect;
            sy = 0;
            sx = (img.width - sw) / 2;
          } else {
            // Source is taller than target, crop the height
            sw = img.width;
            sh = sw / targetAspect;
            sx = 0;
            sy = (img.height - sh) / 2;
          }
          
          // Draw the image centered and cropped to match the 444x333 aspect ratio
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 444, 333);
          
          // Get the high quality image as base64
          const highQualityImage = canvas.toDataURL('image/jpeg', 1.0); // Use highest quality (1.0)
          resolve(highQualityImage);
        } else {
          resolve(imageSrc); // Fallback to original if canvas context unavailable
        }
      };
      
      img.onerror = () => resolve(imageSrc); // Fallback to original on error
      img.src = imageSrc;
    });
  };

  const handleWebcamCapture = useCallback(async () => {
    // If models are loaded, require proper face positioning
    if (modelsLoaded && !faceProperlyPositioned) {
      alert(
        `Please position your face properly before capturing. ${positioningFeedback}`
      );
      return;
    }

    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Just like visitor registration - pass base64 data directly
      const processedImage = await captureImageAsFile(imageSrc);
      setImagePreview(imageSrc);
      onCapture(processedImage); // Pass base64 data, not URL
      setShowCameraModal(false);
      setFaceDetectionActive(false);
    }
  }, [faceProperlyPositioned, modelsLoaded, positioningFeedback, onCapture]);

  const handleRetakePhoto = useCallback(() => {
    setImagePreview(null);
    onCapture(""); // Clear the base64 data
    setShowCameraModal(true);
  }, [onCapture]);

  const openInstructionsModal = useCallback(() => {
    setShowInstructionsModal(true);
  }, []);

  const openCameraModal = useCallback(() => {
    setShowInstructionsModal(false);
    setShowCameraModal(true);
    setCameraError(null);
  }, []);

  const handleCameraModalOpen = useCallback(() => {
    setCameraLoading(true);
    setFaceDetectionActive(true);
    setCameraError(null);
  }, []);

  const handleCameraModalClose = useCallback(() => {
    setShowCameraModal(false);
    setFaceDetectionActive(false);
    setCameraLoading(false);
    setCameraError(null);
    setFaceDetected(false);
    setFaceConfidence(0);
    setFacePosition(null);
    setFaceProperlyPositioned(false);
    setPositioningFeedback("");
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Set preview from capturedImageUrl prop
  useEffect(() => {
    if (capturedImageUrl) {
      setImagePreview(capturedImageUrl);
    } else {
      setImagePreview(null);
    }
  }, [capturedImageUrl]);

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      {imagePreview ? (
        <div className="space-y-4">
          <div className="relative w-48 h-48 mx-auto">
            <img
              src={imagePreview}
              alt="Profile preview"
              className="w-full h-full -scale-x-100 object-cover rounded-lg border-2 border-green-200"
            />
            <div className="absolute -top-2 -right-2 bg-green-100 rounded-full p-1">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800">
              <UserCheck className="w-3 h-3 mr-1" />
              Face Verified
            </Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleRetakePhoto}
            className="w-full flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Photo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-8 h-8  mx-auto mb-2" />
              <p className="text-sm">No photo taken</p>
            </div>
          </div>

          {/* Camera Loading Progress */}
          {!modelsLoaded && modelLoadingProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading face detection models...
              </div>
              <Progress value={modelLoadingProgress} className="w-full" />
            </div>
          )}

          {/* Action Button */}
          <Button
            type="button"
            onClick={openInstructionsModal}
            disabled={modelLoadingProgress > 0 && modelLoadingProgress < 100}
            className="w-full flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {isMobile ? "Take Selfie" : "Open Camera"}
            {isMobile && <Smartphone className="w-4 h-4" />}
            {!isMobile && <Monitor className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {/* Responsive Camera Modal */}
      <Dialog open={showCameraModal} onOpenChange={handleCameraModalClose}>
        <DialogContent
          className={`${
            isMobile
              ? "max-w-[95vw] max-h-[95vh] w-full h-full p-2"
              : "max-w-4xl max-h-[90vh]"
          } overflow-hidden`}
        >
          <DialogHeader className={isMobile ? "text-center" : ""}>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Camera className="w-5 h-5" />
              Take Your Profile Photo
              {isMobile && <Smartphone className="w-4 h-4" />}
              {!isMobile && <Monitor className="w-4 h-4" />}
            </DialogTitle>
            <DialogDescription className="text-center">
              {modelLoadingProgress > 0 && modelLoadingProgress < 100
                ? "Loading face detection system..."
                : !modelsLoaded
                ? "Face detection disabled. You can still capture your photo manually."
                : !faceDetected
                ? "Position your face within the oval guide. The capture button will activate when your face is properly positioned."
                : !faceProperlyPositioned
                ? positioningFeedback
                : "Perfect! Your face is properly positioned. You can now capture your photo."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 p-2">
            {modelLoadingProgress > 0 && modelLoadingProgress < 100 ? (
              <div className="text-center space-y-4 py-8">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
                <p className="text-gray-600">Initializing face detection...</p>
                <Progress
                  value={modelLoadingProgress}
                  className="w-64 mx-auto"
                />
              </div>
            ) : (
              <>
                {/* Camera Feed */}
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={`rounded-lg border-2 ${
                      faceProperlyPositioned
                        ? "border-green-400"
                        : faceDetected
                        ? "border-orange-400"
                        : "border-gray-300"
                    } -scale-x-100`}
                    style={{
                      width: "444px",
                      height: "333px",
                      objectFit: "cover"
                    }}
                    videoConstraints={{
                      facingMode: facingMode,
                      width: 444,
                      height: 333,
                      aspectRatio: 444/333,
                    }}
                    screenshotQuality={1}
                    imageSmoothing={true}
                    onUserMedia={handleCameraModalOpen}
                    onUserMediaError={(error) => {
                      console.error("Camera error:", error);
                      setCameraError(
                        "Unable to access camera. Please check permissions."
                      );
                    }}
                  />

                  {/* Face Detection Overlay */}
                  {modelsLoaded && facePosition && (
                    <div
                      className={`absolute border-2 rounded-lg pointer-events-none ${
                        faceProperlyPositioned
                          ? "border-green-400"
                          : "border-orange-400"
                      }`}
                      style={{
                        left: `${facePosition.x}px`,
                        top: `${facePosition.y}px`,
                        width: `${facePosition.width}px`,
                        height: `${facePosition.height}px`,
                      }}
                    />
                  )}

                  {/* Face Detection Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {modelsLoaded && (
                      <>
                        {/* Oval guide */}
                        <div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-blue-400 rounded-full opacity-70"
                          style={{
                            width: "230px",
                            height: "230px",
                          }}
                        />
                        {/* Guide lines for better positioning */}
                        <div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-blue-300 opacity-30"
                          style={{
                            width: "1px",
                            height: "230px",
                          }}
                        />
                        <div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-blue-300 opacity-30"
                          style={{
                            width: "230px",
                            height: "1px",
                          }}
                        />
                      </>
                    )}
                    <div className="absolute top-2 left-2 right-2">
                      <Badge
                        variant={
                          modelsLoaded && faceProperlyPositioned
                            ? "default"
                            : "secondary"
                        }
                        className={`${
                          modelsLoaded && faceProperlyPositioned
                            ? "bg-green-500 text-white"
                            : modelsLoaded && faceDetected
                            ? "bg-orange-500 text-white"
                            : modelsLoaded
                            ? "bg-yellow-500 text-white"
                            : "bg-gray-500 text-white"
                        } text-xs`}
                      >
                        {!modelsLoaded ? (
                          <>
                            <Camera className="w-3 h-3 mr-1" />
                            Manual Mode
                          </>
                        ) : faceProperlyPositioned ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Ready to Capture!
                          </>
                        ) : faceDetected ? (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {positioningFeedback}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Position your face in the oval
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {cameraError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700 text-sm">{cameraError}</p>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex gap-3 flex-wrap justify-center">
                  {isMobile && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={switchCamera}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Flip Camera
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={handleWebcamCapture}
                    disabled={modelsLoaded && !faceProperlyPositioned}
                    className={`flex items-center gap-2 dark:text-accent-foreground ${
                      modelsLoaded && faceProperlyPositioned
                        ? "bg-green-600 hover:bg-green-700"
                        : !modelsLoaded
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <>
                      <Camera className="w-4 h-4" />
                      {!modelsLoaded
                        ? "Capture Photo"
                        : faceProperlyPositioned
                        ? "Capture Photo"
                        : "Position Face Properly"}
                    </>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCameraModalClose}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>

                {/* Instructions */}
                <div className="text-center space-y-2 max-w-md">
                  <p className="text-sm text-gray-600">
                    📱 Keep your device steady and look directly at the camera
                  </p>
                  <p className="text-xs text-gray-500">
                    Face detection ensures better photo quality for verification
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions Modal */}
      <FaceCaptureInstructions
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        onProceed={openCameraModal}
        isMobile={isMobile}
      />
    </div>
  );
}
