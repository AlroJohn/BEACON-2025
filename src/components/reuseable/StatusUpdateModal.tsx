"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: 'ACTIVE' | 'INACTIVE', notes?: string) => void;
  currentStatus: string;
  userName: string;
  entityType: 'sponsor' | 'exhibitor';
  isLoading?: boolean;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  userName,
  entityType,
  isLoading = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(selectedStatus, notes.trim() || undefined);
    setNotes("");
  };

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'INACTIVE':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600';
      case 'INACTIVE':
        return 'text-red-600';
      case 'PENDING':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const entityDisplayName = entityType === 'sponsor' ? 'Sponsorship' : 'Exhibition';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(selectedStatus)}
            Update {entityDisplayName} Status
          </DialogTitle>
          <DialogDescription>
            Update the status for {userName}'s {entityType} application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Current Status */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <Label className="text-sm font-medium text-gray-600">Current Status</Label>
            <p className={`font-semibold ${getStatusColor(currentStatus)}`}>
              {currentStatus}
            </p>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value: 'ACTIVE' | 'INACTIVE') => setSelectedStatus(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>ACTIVE - Approve Application</span>
                  </div>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>INACTIVE - Decline Application</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes {selectedStatus === 'INACTIVE' ? '(Required for rejection)' : '(Optional)'}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                selectedStatus === 'ACTIVE'
                  ? "Add any additional information for the approved application..."
                  : "Please provide a reason for rejection..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Status Impact Information */}
          <div className={`p-3 rounded-lg border-l-4 ${
            selectedStatus === 'ACTIVE' 
              ? 'bg-green-50 border-green-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <p className={`text-sm font-medium ${
              selectedStatus === 'ACTIVE' ? 'text-green-800' : 'text-red-800'
            }`}>
              {selectedStatus === 'ACTIVE' ? '✅ Application Approval' : '❌ Application Rejection'}
            </p>
            <p className={`text-xs mt-1 ${
              selectedStatus === 'ACTIVE' ? 'text-green-700' : 'text-red-700'
            }`}>
              {selectedStatus === 'ACTIVE' 
                ? `The user will receive an approval email with QR code and access credentials.`
                : `The user will receive a rejection email with the reason provided.`
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (selectedStatus === 'INACTIVE' && !notes.trim())}
            className={
              selectedStatus === 'ACTIVE'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedStatus === 'ACTIVE' ? 'Approve Application' : 'Reject Application'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdateModal;