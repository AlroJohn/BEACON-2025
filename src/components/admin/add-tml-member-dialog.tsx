"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Users } from "lucide-react";

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

// Simple validation schema for TML member - only email required
const tmlMemberSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  companyName: z.string().optional(),
});

type TmlMemberFormData = z.infer<typeof tmlMemberSchema>;

interface AddTmlMemberDialogProps {
  onMemberCreated?: () => void;
}

export function AddTmlMemberDialog({ onMemberCreated }: AddTmlMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TmlMemberFormData>({
    resolver: zodResolver(tmlMemberSchema),
    defaultValues: {
      email: "",
      companyName: "",
    },
  });

  const onSubmit = async (data: TmlMemberFormData) => {
    setIsSubmitting(true);
    try {
      // Create minimal TML member with basic info
      const payload = {
        email: data.email,
        companyName: data.companyName || null,
        isActive: true,
      };

      // Create the TML member
      const response = await fetch('/api/members/tml/quick-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create TML member');
      }

      toast.success('TML member created successfully!', {
        description: `${data.companyName || 'Member'} has been added. Use the action menu to edit member details.`,
      });

      form.reset();
      setOpen(false);
      onMemberCreated?.();

    } catch (error) {
      console.error('Error creating TML member:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create TML member'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add TML Member
          </DialogTitle>
          <DialogDescription>
            Add a new TML member with their email and company name. 
            Use the action menu to edit member details later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="member@tml.org" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="The Maritime League" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">What happens next?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• A basic TML member profile will be created</li>
                    <li>• Use the action menu (⋮) to edit member details</li>
                    <li>• Add personal information like name and contact details</li>
                    <li>• Send bulk messages to TML members when needed</li>
                    <li>• The member will be active by default</li>
                  </ul>
                </div>
              </div>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating Member..." : "Create Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}