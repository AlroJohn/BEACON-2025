"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  genderOptions,
  ageBracketOptions,
} from "@/types/conference/registration";
import { PersonalInformationProps } from "@/types/conference/components";

// Use conference-specific face capture with direct upload
import { FaceCaptureWithUpload } from "../components/FaceCaptureWithUpload";

export default function PersonalInformation({
  form,
}: PersonalInformationProps) {
  const handleFaceCapture = (imageUrl: string) => {
    // Store the uploaded image URL in the form
    form.setValue("faceScannedUrl", imageUrl);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>1. First Name *</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="First name"
                    className="text-base"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>2. Last Name *</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Last name"
                    className="text-base"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>3. Middle Name</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Middle name (optional)"
                    className="text-base"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>4. Suffix</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Jr., Sr., III, etc. (optional)"
                    className="text-base"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Preferred Name */}
          <FormField
            control={form.control}
            name="preferredName"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>5. Preferred Name</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="How would you like to be called?"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Nationality */}
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>6. Nationality *</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Filipino, American, etc."
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>7. Gender *</FormLabel>
                  <FormMessage />
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Age Bracket */}
          <FormField
            control={form.control}
            name="ageBracket"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>8. Age Bracket *</FormLabel>
                  <FormMessage />
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select age bracket" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ageBracketOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* Gender Others field - conditionally shown */}
        {form.watch("gender") === "OTHERS" && (
          <FormField
            control={form.control}
            name="genderOthers"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Please specify *</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Please specify your gender"
                    className="text-base"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Face Capture Section */}
        <Card className="dark:bg-c1/30 bg-muted">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">9. Photo Capture *</span>
              </div>
              <p className="text-sm ">
                Please capture a clear photo of yourself for identification
                purposes.
              </p>

              {/* Use the advanced FaceCaptureWithUpload component */}
              <FaceCaptureWithUpload
                onCapture={handleFaceCapture}
                capturedImageUrl={form.watch("faceScannedUrl")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Hidden field for face scan URL */}
        <FormField
          control={form.control}
          name="faceScannedUrl"
          render={({ field }) => (
            <input type="hidden" {...field} value={field.value || ""} />
          )}
        />
      </div>
    </div>
  );
}
