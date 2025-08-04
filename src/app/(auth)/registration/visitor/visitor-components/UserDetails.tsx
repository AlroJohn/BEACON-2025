import { UseFormReturn } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
import { RegistrationFormData } from "@/hooks/standard-hooks/visitor/useRegistrationSchema";
import { FaceCapture } from "../components/FaceCapture";

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  { value: "OTHERS", label: "Others" },
];

const ageBracketOptions = [
  { value: "UNDER_18", label: "Under 18" },
  { value: "AGE_18_24", label: "18-24" },
  { value: "AGE_25_34", label: "25-34" },
  { value: "AGE_35_44", label: "35-44" },
  { value: "AGE_45_54", label: "45-54" },
  { value: "AGE_55_ABOVE", label: "55 and above" },
];

interface UserDetailsProps {
  form: UseFormReturn<RegistrationFormData>;
}

export function UserDetails({ form }: UserDetailsProps) {
  const handleFaceCapture = (imageDataUrl: string) => {
    form.setValue("faceScannedUrl", imageDataUrl);
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
        <Card className="dark:bg-c1/30 bg-muted" data-field="faceScannedUrl">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">9. Photo Capture *</span>
              </div>
              <p className="text-sm">
                Please capture a clear photo of yourself for identification
                purposes.
              </p>

              {/* Use the advanced FaceCapture component */}
              <div
                className="face-capture-component"
                data-field="faceScannedUrl"
              >
                <FaceCapture
                  onCapture={handleFaceCapture}
                  capturedImage={form.watch("faceScannedUrl")}
                />
              </div>
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
