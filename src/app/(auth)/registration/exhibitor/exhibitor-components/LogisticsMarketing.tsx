import { UseFormReturn } from "react-hook-form";
import { useState, useRef } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExhibitorRegistrationFormData,
  yesNoMaybeOptions,
  marketingCollateralsOptions,
} from "@/types/exhibitor/registration";
import { Upload, X, FileImage, AlertCircle, CheckCircle2 } from "lucide-react";

interface LogisticsMarketingProps {
  form: UseFormReturn<ExhibitorRegistrationFormData>;
}

interface LogoUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

function LogoUpload({ onFileSelect, selectedFile }: LogoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSize = 1;
  15 * 1024 * 1024; // 5MB
  const acceptedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/svg+xml",
    "image/webp",
  ];

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return "File size must be less than 5MB";
    }
    if (!acceptedTypes.includes(file.type)) {
      return "Please upload a valid image file (PNG, JPG, GIF, SVG, WebP)";
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    onFileSelect(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadStatus("success");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    setPreviewUrl(null);
    setUploadStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full dark:bg-c1/30 bg-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileImage className="h-5 w-5 text-primary" />
          3. Company Logo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload your company logo for marketing materials and event promotions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
              ${
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }
              ${
                uploadStatus === "error"
                  ? "border-destructive bg-destructive/5"
                  : ""
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              {uploadStatus === "uploading" ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Uploading...</p>
                </>
              ) : uploadStatus === "success" && previewUrl ? (
                <>
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="h-20 w-20 object-contain rounded-lg border bg-background"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2 justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : ""}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      uploadStatus === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {uploadStatus === "error" ? (
                      <AlertCircle className="h-6 w-6" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">
                      {uploadStatus === "error"
                        ? "Upload failed"
                        : "Drop your logo here, or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, SVG, WebP up to 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File Format Info */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="text-xs dark:bg-c1/30 bg-muted"
            >
              PNG
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs dark:bg-c1/30 bg-muted"
            >
              JPG
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs dark:bg-c1/30 bg-muted"
            >
              SVG
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs dark:bg-c1/30 bg-muted"
            >
              GIF
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs dark:bg-c1/30 bg-muted"
            >
              WebP
            </Badge>
          </div>

          {/* File Requirements */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium">Logo Requirements:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• High resolution recommended (min. 300px width)</li>
              <li>• Square or rectangular format preferred</li>
              <li>• Transparent background (PNG) for best results</li>
              <li>• Maximum file size: 5MB</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LogisticsMarketing({ form }: LogisticsMarketingProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Large Equipment */}
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="bringLargeEquipment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  1. Will you bring large equipment or machinery?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {yesNoMaybeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Marketing Collaterals */}
          <FormField
            control={form.control}
            name="haveMarketingCollaterals"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  2. Marketing Collaterals Status
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select your marketing materials status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {marketingCollateralsOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Company Logo Upload */}
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <LogoUpload
                onFileSelect={(file) => {
                  setSelectedFile(file);
                  field.onChange(file);
                }}
                selectedFile={selectedFile}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
