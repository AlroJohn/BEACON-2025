import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
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
import {
  SponsorRegistrationFormData,
  activationPreferenceOptions,
  yesNoMaybeOptions,
} from "@/types/sponsors/registration";

interface ActivationPreferencesProps {
  form: UseFormReturn<SponsorRegistrationFormData>;
}

export function ActivationPreferences({ form }: ActivationPreferencesProps) {
  const activationPreferences = form.watch("activationPreferences");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4 items-start">
          <FormField
            control={form.control}
            name="activationPreferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>1. Preferred Activation Method *</FormLabel>

                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full overflow-hidden">
                      <SelectValue placeholder="Select activation preference" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activationPreferenceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                <FormDescription>
                  {" "}
                  Select your preferred way to activate your sponsorship or
                  enter a custom preference
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="launchProduct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  2. Do you plan to launch a new product during the event?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your answer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {yesNoMaybeOptions.map((option) => (
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
        {/* Activation Preferences */}

        {/* Custom Activation Preference */}
        {activationPreferences === "OTHER" && (
          <FormField
            control={form.control}
            name="activationOthers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Please specify your activation preference *
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your custom activation preference"
                    className="min-h-[80px]"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Alternative: Custom text input for activation preferences */}
        {!activationPreferenceOptions.some(
          (opt) => opt.value === activationPreferences
        ) &&
          activationPreferences &&
          activationPreferences !== "OTHER" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Custom Activation Preference:</strong>{" "}
                {activationPreferences}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
