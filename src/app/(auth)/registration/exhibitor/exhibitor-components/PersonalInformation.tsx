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
import {
  ExhibitorRegistrationFormData,
  genderOptions,
  ageBracketOptions,
} from "@/types/exhibitor/registration";
import { FaceCapture } from "../../visitor/components/FaceCapture";

interface PersonalInformationProps {
  form: UseFormReturn<ExhibitorRegistrationFormData>;
}

export function PersonalInformation({ form }: PersonalInformationProps) {
  const gender = form.watch("gender");

  const handleFaceCapture = (imageDataUrl: string) => {
    form.setValue("faceScannedUrl", imageDataUrl);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Face Capture */}
        <Card className="border-dashed dark:bg-c1/30 bg-muted">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Face Capture *</h3>
              <p className="text-xs text-muted-foreground">
                Take a clear photo for your exhibitor badge and identification
              </p>
              <FormField
                control={form.control}
                name="faceScannedUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FaceCapture
                        onCapture={handleFaceCapture}
                        capturedImage={field.value || undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
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
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
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
                  <Input
                    placeholder="Middle name"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suffix</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jr., Sr., III"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preferred Name */}
        <FormField
          control={form.control}
          name="preferredName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Name you'd like to be called"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title/Position*</FormLabel>
              <FormControl>
                <Input placeholder="Enter your position" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender and Age */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender *</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Show Others field if OTHERS is selected */}
          {gender === "OTHERS" && (
            <FormField
              control={form.control}
              name="genderOthers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify Gender *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Please specify"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="ageBracket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age Bracket *</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Nationality */}
        <FormField
          control={form.control}
          name="nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nationality *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Filipino, American, Japanese"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
