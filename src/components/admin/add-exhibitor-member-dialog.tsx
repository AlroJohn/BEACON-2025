"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Building } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Simple validation schema for exhibitor member - only email required
const exhibitorMemberSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  companyName: z.string().optional(),
});

type ExhibitorMemberFormData = z.infer<typeof exhibitorMemberSchema>;

interface AddExhibitorMemberDialogProps {
  onMemberCreated?: () => void;
}

export function AddExhibitorMemberDialog({ onMemberCreated }: AddExhibitorMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ExhibitorMemberFormData>({
    resolver: zodResolver(exhibitorMemberSchema),
    defaultValues: {
      email: "",
      companyName: "",
    },
  });

  const onSubmit = async (data: ExhibitorMemberFormData) => {
    setIsSubmitting(true);
    try {
      // Create minimal exhibitor member with basic info
      const payload = {
        email: data.email,
        companyName: data.companyName || null,
        isActive: true,
      };

      // Create the exhibitor member only (no automatic code sending)
      const response = await fetch('/api/members/exhibitor/quick-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create exhibitor member');
      }

      toast.success('Exhibitor member created successfully!', {
        description: `${data.companyName || 'Member'} has been added. Use the action menu to send them an exhibitor code.`,
      });

      form.reset();
      setOpen(false);
      onMemberCreated?.();

    } catch (error) {
      console.error('Error creating exhibitor member:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create exhibitor member'
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
            <Building className="h-5 w-5" />
            Add Exhibitor Member
          </DialogTitle>
          <DialogDescription>
            Add a new exhibitor member with their email and company name. 
            Use the action menu to send them an exhibitor code later.
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
                        placeholder="contact@maritimecompany.com" 
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
                        placeholder="Maritime Solutions Inc" 
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
                  <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">What happens next?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• A basic exhibitor profile will be created</li>
                    <li>• Use the action menu (⋮) to send an exhibitor code</li>
                    <li>• Edit member details using the action menu</li>
                    <li>• The code can be emailed to them when ready</li>
                    <li>• They can use the code to register for BEACON 2025</li>
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