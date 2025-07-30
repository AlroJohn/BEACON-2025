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
import { ExhibitorRegistrationFormData } from "@/types/exhibitor/registration";

interface ContactInformationProps {
  form: UseFormReturn<ExhibitorRegistrationFormData>;
}

export function ContactInformation({ form }: ContactInformationProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>1. Email Address *</FormLabel>
              <FormControl>
                <Input
                  placeholder="your.email@company.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">2. Phone *</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    {/* Static prefix */}
                    <div className="absolute left-3 z-10 px-1">+63</div>
                    <Input
                      placeholder="9XXXXXXXXX"
                      {...field}
                      // Display only the part after +63
                      value={field.value?.replace("+63", "") || ""}
                      onChange={(e) => {
                        let numbersOnly = e.target.value.replace(/\D/g, "");
                        // enforce first digit is 9
                        if (numbersOnly.length > 0 && numbersOnly[0] !== "9") {
                          numbersOnly = "9" + numbersOnly.replace(/^9*/, "");
                        }
                        const truncated = numbersOnly.slice(0, 10); // enforce 10 digits including the starting 9
                        field.onChange(`+63${truncated}`);
                      }}
                      className="pl-12"
                      maxLength={10}
                    />
                  </div>
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
                <FormLabel className="text-base">2. Phone *</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    {/* Static prefix */}
                    <div className="absolute left-3 z-10 px-1">+63</div>
                    <Input
                      placeholder="9XXXXXXXXX"
                      {...field}
                      // Display only the part after +63
                      value={field.value?.replace("+63", "") || ""}
                      onChange={(e) => {
                        let numbersOnly = e.target.value.replace(/\D/g, "");
                        // enforce first digit is 9
                        // if (numbersOnly.length > 0 && numbersOnly[0] !== "9") {
                        //   numbersOnly = "9" + numbersOnly.replace(/^9*/, "");
                        // }
                        const truncated = numbersOnly.slice(0, 10); // enforce 10 digits including the starting 9
                        field.onChange(`+63${truncated}`);
                      }}
                      className="pl-12"
                      maxLength={10}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Mailing Address */}
        <FormField
          control={form.control}
          name="mailingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Mailing Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Complete mailing address for correspondence"
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
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
