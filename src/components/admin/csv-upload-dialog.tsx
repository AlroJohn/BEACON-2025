"use client";

import * as React from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

interface UploadResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ValidationError[];
  duplicates: string[];
}

interface CSVUploadDialogProps {
  memberType: 'tml' | 'exhibitor';
  onUploadComplete?: () => void;
}

export function CSVUploadDialog({ memberType, onUploadComplete }: CSVUploadDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadResult, setUploadResult] = React.useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const memberTypeLabel = memberType === 'tml' ? 'TML' : 'Exhibitor';

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size too large. Maximum 5MB allowed.');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  }, []);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/members/${memberType}/bulk-upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);

      if (result.errorCount === 0) {
        toast.success(`Successfully uploaded ${result.successCount} ${memberTypeLabel} members!`);
        onUploadComplete?.();
      } else {
        toast.warning(`Upload completed with ${result.errorCount} errors. ${result.successCount} members were successfully imported.`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const downloadTemplate = (type?: 'simple' | 'full') => {
    const link = document.createElement('a');
    const params = type ? `?type=${type}` : '';
    link.href = `/api/members/${memberType}/template${params}`;
    const filename = type === 'simple' 
      ? `${memberType}-members-simple-template.csv`
      : `${memberType}-members-template.csv`;
    link.download = filename;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload {memberTypeLabel} Members (CSV)
          </DialogTitle>
          <DialogDescription>
            Upload multiple {memberTypeLabel} members from a CSV file. 
            {memberType === 'tml' 
              ? 'Only email column is required - you can upload a single-column CSV with just emails!' 
              : 'Make sure your CSV follows the correct format.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800">Need a template?</h4>
                <p className="text-sm text-blue-600">
                  {memberType === 'tml' 
                    ? 'Download the CSV template. For simple uploads, just use an email column!' 
                    : 'Download the CSV template with the correct format and required columns.'}
                </p>
              </div>
              <div className="flex gap-2">
                {memberType === 'tml' && (
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate('simple')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Simple (Email Only)
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => downloadTemplate('full')}>
                  <FileText className="h-4 w-4 mr-2" />
                  {memberType === 'tml' ? 'Full Template' : 'Download Template'}
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          {!uploadResult && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center border-gray-300 hover:border-gray-400 transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2">Click to select your CSV file</p>
                    <p className="text-sm text-muted-foreground">
                      Maximum file size: 5MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Choose CSV File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading and processing...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Success</p>
                      <p className="text-sm text-green-600">{uploadResult.successCount} members</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Errors</p>
                      <p className="text-sm text-red-600">{uploadResult.errorCount} rows</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Total</p>
                      <p className="text-sm text-gray-600">{uploadResult.totalRows} rows</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">Validation Errors</h4>
                  <ScrollArea className="h-[200px] border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResult.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell><Badge variant="outline">{error.field}</Badge></TableCell>
                            <TableCell className="font-mono text-sm">{error.value}</TableCell>
                            <TableCell className="text-red-600">{error.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Duplicate Emails */}
              {uploadResult.duplicates.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-yellow-800">Duplicate Emails (Skipped)</h4>
                  <div className="flex flex-wrap gap-2">
                    {uploadResult.duplicates.map((email, index) => (
                      <Badge key={index} variant="outline" className="bg-yellow-50">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {uploadResult ? 'Close' : 'Cancel'}
          </Button>
          {selectedFile && !uploadResult && (
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Upload Members'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}