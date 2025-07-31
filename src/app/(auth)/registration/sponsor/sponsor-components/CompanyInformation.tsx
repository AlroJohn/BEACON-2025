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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SponsorRegistrationFormData,
  industrySectorOptions,
} from "@/types/sponsors/registration";

interface CompanyInformationProps {
  form: UseFormReturn<SponsorRegistrationFormData>;
}

export function CompanyInformation({ form }: CompanyInformationProps) {
  const industrySector = form.watch("industrySector");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>1. Company/Organization Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your company or organization name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Business Registration Name */}
          <FormField
            control={form.control}
            name="businessRegistrationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  2. Registered Business Name (if different)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter registered business name (optional)"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Industry Sector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="industrySector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>3. Industry Sector *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full overflow-hidden">
                      <SelectValue placeholder="Select industry sector" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {industrySectorOptions.map((option) => (
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

          {/* Company Website */}
          <FormField
            control={form.control}
            name="companyWebsite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>5. Company Website</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.yourcompany.com"
                    type="url"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Industry Sector Others */}
          {industrySector === "OTHERS" && (
            <FormField
              control={form.control}
              name="industrySectorOthers"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Please specify *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Specify your industry sector"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Company Address */}
        <FormField
          control={form.control}
          name="companyAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Company Address *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter complete company address"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Profile */}
        <FormField
          control={form.control}
          name="companyProfile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>6. Company Profile *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description about your company (Who you are & what you do)"
                  className="min-h-[120px]"
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
