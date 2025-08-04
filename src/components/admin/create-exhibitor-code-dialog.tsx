"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Badge, Shuffle } from "lucide-react";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const createExhibitorCodeSchema = z.object({
  code: z.string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, underscores, and hyphens"),
  isActive: z.boolean(),
});

type CreateExhibitorCodeFormData = z.infer<typeof createExhibitorCodeSchema>;

interface CreateExhibitorCodeDialogProps {
  trigger: React.ReactNode;
  onCodeCreated: () => void;
  editingCode?: {
    id: string;
    code: string;
    isActive: boolean;
  };
  mode?: 'create' | 'edit';
}

// Function to generate random 6-character alphanumeric code
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function CreateExhibitorCodeDialog({ 
  trigger, 
  onCodeCreated, 
  editingCode, 
  mode = 'create' 
}: CreateExhibitorCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get initial values based on mode
  const getInitialValues = () => {
    if (mode === 'edit' && editingCode) {
      return {
        code: editingCode.code,
        isActive: editingCode.isActive,
      };
    }
    return {
      code: "",
      isActive: false,
    };
  };

  const form = useForm<CreateExhibitorCodeFormData>({
    resolver: zodResolver(createExhibitorCodeSchema),
    defaultValues: getInitialValues(),
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && mode === 'edit' && editingCode) {
      // Load editing data when opening in edit mode
      form.reset(getInitialValues());
    } else if (!newOpen && !isSubmitting) {
      // Reset form when closing dialog
      form.reset(getInitialValues());
    }
    setOpen(newOpen);
  };

  const handleGenerateRandomCode = () => {
    const randomCode = generateRandomCode();
    form.setValue('code', randomCode);
  };

  const onSubmit = async (data: CreateExhibitorCodeFormData) => {
    setIsSubmitting(true);
    try {
      const codeData = {
        ...(mode === 'edit' && editingCode ? { id: editingCode.id } : {}),
        code: data.code.trim().toUpperCase(),
        isActive: data.isActive,
      };

      const response = await fetch("/api/exhibitor-codes", {
        method: mode === 'edit' ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(codeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${mode} exhibitor code`);
      }

      const result = await response.json();
      
      toast.success(`Exhibitor code ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
      form.reset(getInitialValues());
      handleOpenChange(false);
      onCodeCreated();
    } catch (error) {
      console.error("Error with exhibitor code:", error);
      toast.error(error instanceof Error ? error.message : `Failed to ${mode} exhibitor code`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className="h-5 w-5" />
            {mode === 'edit' ? 'Edit Exhibitor Code' : 'Create New Exhibitor Code'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the exhibitor code details.'
              : 'Add a new exhibitor access code to the system.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Code Input */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exhibitor Code *</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter exhibitor code" 
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="font-mono flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateRandomCode}
                        className="shrink-0"
                        title="Generate random 6-digit code"
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter a unique exhibitor code or click the shuffle button to generate a random 6-character code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Code</FormLabel>
                    <FormDescription>
                      Active codes can be used for exhibitor registration. Inactive codes are disabled.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  mode === 'edit' ? 'Update Code' : 'Create Code'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}