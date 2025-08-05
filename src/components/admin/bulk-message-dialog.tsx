"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Send, Users, MessageSquare, ScrollText } from "lucide-react";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Validation schema for bulk message
const bulkMessageSchema = z.object({
  filterActive: z.enum(["ALL", "ACTIVE", "INACTIVE"]),
  filterCodeStatus: z.enum(["ALL", "HAS_CODE", "NO_CODE"]),
  sendCodesToMembers: z.boolean(),
  testMode: z.boolean(),
});

type BulkMessageFormData = {
  filterActive: "ALL" | "ACTIVE" | "INACTIVE";
  filterCodeStatus: "ALL" | "HAS_CODE" | "NO_CODE";
  sendCodesToMembers: boolean;
  testMode: boolean;
};

interface BulkMessageDialogProps {
  memberType: "tml" | "exhibitor";
}

export function BulkMessageDialog({ memberType }: BulkMessageDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recipients, setRecipients] = React.useState<
    Array<{ id: string; email: string; firstName?: string; lastName?: string }>
  >([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = React.useState(false);
  const [selectedRecipients, setSelectedRecipients] = React.useState<
    Set<string>
  >(new Set());

  const form = useForm<BulkMessageFormData>({
    resolver: zodResolver(bulkMessageSchema),
    defaultValues: {
      filterActive: "ALL" as const,
      filterCodeStatus: "NO_CODE" as const,
      sendCodesToMembers: true,
      testMode: false,
    },
  });

  const memberTypeLabel = memberType === "tml" ? "TML" : "Exhibitor";

  // Get list of members without codes
  const fetchRecipients = React.useCallback(async () => {
    if (memberType !== "exhibitor") return;

    setIsLoadingRecipients(true);
    try {
      const params = new URLSearchParams();
      params.append("codeStatus", "NO_CODE");
      params.append("limit", "1000");

      const response = await fetch(`/api/members/${memberType}?${params}`);
      const result = await response.json();

      if (response.ok) {
        setRecipients(result.data || []);
      } else {
        setRecipients([]);
      }
    } catch (error) {
      console.error("Error fetching recipients:", error);
      setRecipients([]);
    } finally {
      setIsLoadingRecipients(false);
    }
  }, [memberType]);

  // Fetch recipients when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchRecipients();
      setSelectedRecipients(new Set()); // Clear selections when dialog opens
    }
  }, [open, fetchRecipients]);

  // Handle individual recipient selection
  const handleRecipientToggle = (recipientId: string) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(recipientId)) {
      newSelected.delete(recipientId);
    } else {
      newSelected.add(recipientId);
    }
    setSelectedRecipients(newSelected);
  };

  // Handle select all / deselect all
  const handleSelectAll = () => {
    if (selectedRecipients.size === recipients.length) {
      // Deselect all
      setSelectedRecipients(new Set());
    } else {
      // Select all
      setSelectedRecipients(new Set(recipients.map((r) => r.id)));
    }
  };

  const isAllSelected =
    selectedRecipients.size === recipients.length && recipients.length > 0;
  const isPartiallySelected =
    selectedRecipients.size > 0 && selectedRecipients.size < recipients.length;

  const onSubmit = async (data: BulkMessageFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/members/${memberType}/bulk-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          selectedRecipientIds: Array.from(selectedRecipients),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send bulk message");
      }

      const { totalSent, successfulSends, failedSends, codesSent } = result;

      if (data.testMode) {
        toast.success("Test operation completed!", {
          description: `${codesSent} exhibitor codes would be sent to ${selectedRecipients.size} selected ${memberTypeLabel} members.`,
        });
      } else {
        if (failedSends > 0) {
          toast.warning(`Bulk operation completed with some failures`, {
            description: `${successfulSends} codes sent successfully, ${failedSends} failed.`,
          });
        } else {
          toast.success("Bulk operation completed successfully!", {
            description: `${codesSent} exhibitor codes sent to ${successfulSends} ${memberTypeLabel} members.`,
          });
        }
      }

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error sending bulk message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send bulk message"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="h-4 w-4 mr-2" />
          Bulk Message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Send Exhibitor Codes to {memberTypeLabel} Members
          </DialogTitle>
          <DialogDescription>
            Send exhibitor access codes to multiple {memberTypeLabel} members at
            once. Use filters to target specific groups who don't have codes
            yet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 overflow-y-auto"
          >
            {/* Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Target Recipients
              </h3>
              <div className=" p-4 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Target:</span>
                    <span className="text-sm">
                      All exhibitor members without codes
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium">Filter:</span>
                    <span className="text-sm">sentCode is null or empty</span>
                  </div>
                </div>
              </div>

              {/* Recipients List */}
              <div className=" p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 " />
                    <span className="text-sm font-medium">
                      Recipients ({recipients.length} {memberTypeLabel} members
                      without codes):
                    </span>
                  </div>
                  {recipients.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-7"
                    >
                      {isAllSelected ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                {selectedRecipients.size > 0 && (
                  <div className="mb-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {selectedRecipients.size} selected
                    </Badge>
                  </div>
                )}

                {isLoadingRecipients ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin " />
                    <span className="ml-2 text-sm ">Loading recipients...</span>
                  </div>
                ) : recipients.length > 0 ? (
                  <ScrollArea className="h-40 w-full rounded-md border  p-2">
                    <div className="space-y-1">
                      {recipients.map((recipient, index) => (
                        <div
                          key={recipient.id || index}
                          className="flex items-center space-x-2 py-1 px-2 rounded"
                        >
                          <Checkbox
                            id={`recipient-${recipient.id || index}`}
                            checked={selectedRecipients.has(recipient.id)}
                            onCheckedChange={() =>
                              handleRecipientToggle(recipient.id)
                            }
                          />
                          <label
                            htmlFor={`recipient-${recipient.id || index}`}
                            className="text-sm font-mono cursor-pointer flex-1"
                          >
                            {recipient.email}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No members without codes found
                  </div>
                )}
              </div>
            </div>

            {/* Email Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Email Information
              </h3>
              <div className="p-4 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Subject:</span>
                    <span className="text-sm">
                      Your BEACON 2025 Exhibitor Code
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium">Content:</span>
                    <span className="text-sm">
                      Standard exhibitor code email with access instructions and
                      event details
                    </span>
                  </div>
                  <div className="text-xs  mt-2">
                    ℹ️ Each recipient will receive a personalized email with
                    their unique exhibitor code
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Options</h3>
              {memberType === "exhibitor" && (
                <FormField
                  control={form.control}
                  name="sendCodesToMembers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Send Exhibitor Codes to Selected Members
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Send available exhibitor codes to the selected
                          members. This will automatically assign and email
                          codes to members who don't have one yet.
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedRecipients.size === 0}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting
                  ? "Sending Codes..."
                  : `Send Codes to ${selectedRecipients.size} Selected Members`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
