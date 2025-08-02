import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Download, ExternalLink, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageModalProps {
  imageUrl: string;
  title: string;
  description?: string;
  altText?: string;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "link";
  showDownload?: boolean;
  className?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  title,
  description,
  altText,
  triggerText = "View Image",
  triggerVariant = "outline",
  showDownload = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  const minZoom = 0.75;
  const maxZoom = 2;
  const zoomStep = 0.1;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = title.replace(/\s+/g, "_") + "_image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + zoomStep, maxZoom));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - zoomStep, minZoom));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const resetZoomOnClose = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
    setImageLoaded(false);
    setImageError(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!imageUrl) {
    return (
      <span className="text-muted-foreground text-sm">No image available</span>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetZoomOnClose();
    }}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          className={`h-8 ${className}`}
        >
          <Eye className="h-3 w-3 mr-1" />
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-xl max-h-[95vh] p-0 flex-col flex justify-center items-center">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {title}
            </span>
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="px-6">
          <div className="relative bg-muted rounded-lg overflow-hidden max-h-[60vh] flex items-center justify-center border">
            {!imageError ? (
              <>
                <div 
                  className="flex items-center justify-center p-4 w-full h-full"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                >
                  <img
                    src={imageUrl}
                    alt={altText || title}
                    className="object-contain transition-transform duration-200 select-none"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                      maxHeight: '50vh',
                      maxWidth: '90vw',
                      pointerEvents: zoomLevel > 1 ? 'auto' : 'none',
                    }}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    onMouseDown={handleMouseDown}
                    draggable={false}
                  />
                </div>
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <X className="h-12 w-12 mb-2" />
                <p>Failed to load image</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="mt-2"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Try opening in new tab
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-4 border-t">
          <div className="flex items-center justify-between w-full">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= minZoom}
                className="h-8"
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                disabled={zoomLevel === 1}
                className="h-8 px-3"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {Math.round(zoomLevel * 100)}%
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= maxZoom}
                className="h-8"
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2">
              {showDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="h-8"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
