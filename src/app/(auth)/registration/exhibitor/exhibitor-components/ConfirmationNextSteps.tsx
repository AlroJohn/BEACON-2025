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
import { Textarea } from "@/components/ui/textarea";
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
  confirmIntentOptions,
} from "@/types/exhibitor/registration";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  File,
} from "lucide-react";

interface ConfirmationNextStepsProps {
  form: UseFormReturn<ExhibitorRegistrationFormData>;
}

interface LetterOfIntentUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

function LetterOfIntentUpload({
  onFileSelect,
  selectedFile,
}: LetterOfIntentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const acceptedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/webp",
  ];

  const acceptedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tiff",
    ".webp",
  ];

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return "File size must be less than 10MB";
    }
    if (
      !acceptedTypes.includes(file.type) &&
      !acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
      return "Please upload a valid document (PDF, DOC, DOCX) or image file";
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
    setUploadStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.toLowerCase().split(".").pop();
    if (["pdf"].includes(extension || ""))
      return <FileText className="h-8 w-8 text-red-500" />;
    if (["doc", "docx"].includes(extension || ""))
      return <FileText className="h-8 w-8 text-blue-500" />;
    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"].includes(
        extension || ""
      )
    ) {
      return <File className="h-8 w-8 text-green-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Letter of Intent
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a formal letter of intent - supports documents and images
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
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
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
              ) : uploadStatus === "success" && selectedFile ? (
                <>
                  <div className="relative">
                    <div className="flex flex-col items-center space-y-2 p-4 bg-background rounded-lg border">
                      {getFileIcon(selectedFile.name)}
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
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2 justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
                        : "Drop your letter here, or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, or image files up to 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File Format Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              PDF
            </Badge>
            <Badge variant="secondary" className="text-xs">
              DOC
            </Badge>
            <Badge variant="secondary" className="text-xs">
              DOCX
            </Badge>
            <Badge variant="secondary" className="text-xs">
              JPG
            </Badge>
            <Badge variant="secondary" className="text-xs">
              PNG
            </Badge>
          </div>

          {/* File Requirements */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium">Document Requirements:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Formal letter on company letterhead (preferred)</li>
              <li>• Clear statement of participation intent</li>
              <li>• Authorized signatory signature</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConfirmationNextSteps({ form }: ConfirmationNextStepsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Confirmation Intent */}
        <FormField
          control={form.control}
          name="confirmIntent"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Confirmation of Intent *
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Please confirm your participation intent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {confirmIntentOptions.map((option) => (
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

        {/* Letter of Intent Upload */}
        <FormField
          control={form.control}
          name="letterOfIntentUrl"
          render={({ field }) => (
            <FormItem>
              <LetterOfIntentUpload
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

        {/* Additional Comments */}
        <FormField
          control={form.control}
          name="additionalComments"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Additional Comments
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information, special requests, or questions you'd like to share with the organizing team"
                  className="min-h-[120px] resize-none"
                  maxLength={1000}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-muted-foreground text-right mt-2">
                {field.value?.length || 0}/1000 characters
              </div>
            </FormItem>
          )}
        />

        {/* Information Notice */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  •
                </span>
                You will receive a confirmation email within 24 hours
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  •
                </span>
                Our team will contact you for booth allocation and payment
                details
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  •
                </span>
                Technical requirements and setup guidelines will be provided
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                  •
                </span>
                Marketing collaboration opportunities will be discussed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
