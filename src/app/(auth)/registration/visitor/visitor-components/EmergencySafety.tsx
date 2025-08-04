import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RegistrationFormData } from "@/hooks/standard-hooks/visitor/useRegistrationSchema";

interface EmergencySafetyProps {
  form: UseFormReturn<RegistrationFormData>;
}

export function EmergencySafety({ form }: EmergencySafetyProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="emergencyContactPerson"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>1. Emergency Contact Person *</FormLabel>
              </div>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emergencyContactNumber"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>2. Emergency Contact Number *</FormLabel>
              </div>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="specialAssistance"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>3. Special Assistance Needed</FormLabel>
            </div>
            <FormControl>
              <Textarea {...field} value={field.value || ""} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
