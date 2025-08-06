"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Edit, Users } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TmlMember } from "@/types/members";

// Validation schema for TML member - firstName/lastName now optional
const tmlMemberSchema = z.object({
  firstName: z.string().max(100, "First name too long").optional().or(z.literal("")),
  lastName: z.string().max(100, "Last name too long").optional().or(z.literal("")),
  middleName: z.string().max(100, "Middle name too long").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  mobileNumber: z.string().max(20, "Mobile number too long").optional().or(z.literal("")),
  landline: z.string().max(20, "Landline too long").optional().or(z.literal("")),
  jobTitle: z.string().max(255, "Job title too long").optional().or(z.literal("")),
  companyName: z.string().max(255, "Company name too long").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type TmlMemberFormData = z.infer<typeof tmlMemberSchema>;

interface EditTmlMemberDialogProps {
  member: TmlMember;
  onMemberUpdated?: () => void;
  children: React.ReactNode;
}

export function EditTmlMemberDialog({ 
  member, 
  onMemberUpdated, 
  children 
}: EditTmlMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(tmlMemberSchema),
    defaultValues: {
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      middleName: member.middleName || "",
      email: member.email || "",
      mobileNumber: member.mobileNumber || "",
      landline: member.landline || "",
      jobTitle: member.jobTitle || "",
      companyName: member.companyName || "",
      isActive: member.isActive ?? true,
    },
  });

  // Reset form when member changes
  React.useEffect(() => {
    if (member) {
      form.reset({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        middleName: member.middleName || "",
        email: member.email || "",
        mobileNumber: member.mobileNumber || "",
        landline: member.landline || "",
        jobTitle: member.jobTitle || "",
        companyName: member.companyName || "",
        isActive: member.isActive ?? true,
      });
    }
  }, [member, form]);

  const onSubmit = async (data: z.infer<typeof tmlMemberSchema>) => {
    setIsSubmitting(true);
    try {
      // Convert empty strings to null for optional fields
      const payload = {
        id: member.id,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        middleName: data.middleName || null,
        email: data.email,
        mobileNumber: data.mobileNumber || null,
        landline: data.landline || null,
        jobTitle: data.jobTitle || null,
        companyName: data.companyName || null,
        isActive: data.isActive,
      };

      const response = await fetch('/api/members/tml', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update TML member');
      }

      // Create a meaningful display name
      const memberName = [data.firstName, data.lastName].filter(Boolean).join(' ') || 
                        data.companyName || 
                        data.email;

      toast.success('TML member updated successfully!', {
        description: `${memberName} has been updated.`,
      });

      setOpen(false);
      onMemberUpdated?.();

    } catch (error) {
      console.error('Error updating TML member:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update TML member'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit TML Member
          </DialogTitle>
          <DialogDescription>
            Update the TML member profile. Only email address is required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Santos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dela Cruz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan.delacruz@tml.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+63 917 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="landline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landline</FormLabel>
                      <FormControl>
                        <Input placeholder="(02) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Maritime Officer" {...field} />
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
                      <FormLabel>Company/Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="The Maritime League" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Status</h3>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isSubmitting ? "Updating..." : "Update Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}