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
import { Card, CardContent } from "@/components/ui/card";
import {
  ExhibitorRegistrationFormData,
  industrySectorOptions,
} from "@/types/exhibitor/registration";

interface CompanyInformationProps {
  form: UseFormReturn<ExhibitorRegistrationFormData>;
}

export function CompanyInformation({ form }: CompanyInformationProps) {
  const industrySector = form.watch("industrySector");

  return (
    <div className="space-y-6">
      <div className="space-y-4 pr-1">
        {/* Company Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessRegistrationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Registration Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Official registered business name (if different)"
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
          {/* Show Others field if OTHERS is selected */}
          <FormField
            control={form.control}
            name="industrySector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry Sector *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
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
          {industrySector === "OTHERS" && (
            <FormField
              control={form.control}
              name="industrySectorOthers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify Industry Sector *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Please specify your industry sector"
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
              <FormLabel>Company Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter complete company address"
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
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
              <FormLabel>Company Website</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.yourcompany.com"
                  type="url"
                  {...field}
                  value={field.value || ""}
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
              <FormLabel>Company Profile</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of your company, products, and services (max 500 characters)"
                  className="min-h-[120px]"
                  maxLength={500}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-muted-foreground text-right">
                {field.value?.length || 0}/500 characters
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
