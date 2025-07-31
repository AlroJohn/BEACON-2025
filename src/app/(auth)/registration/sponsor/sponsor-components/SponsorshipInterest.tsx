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
import { Checkbox } from "@/components/ui/checkbox";
import {
  SponsorRegistrationFormData,
  sponsorshipCategoryOptions,
  targetAudienceOptions,
} from "@/types/sponsors/registration";
import { SponsorshipCategory, SponsorshipAudience } from "@prisma/client";

interface SponsorshipInterestProps {
  form: UseFormReturn<SponsorRegistrationFormData>;
}

export function SponsorshipInterest({ form }: SponsorshipInterestProps) {
  const sponsorshipCategories = form.watch("sponsorshipCategories");
  const targetAudience = form.watch("targetAudience");

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Sponsorship Categories */}
        <FormField
          control={form.control}
          name="sponsorshipCategories"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  1. Sponsorship Categories of Interest *
                </FormLabel>
                <FormDescription className="text-sm text-muted-foreground">
                  Which sponsorship category are you most interested in?
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sponsorshipCategoryOptions.map((item) => (
                  <FormField
                    key={item.value}
                    control={form.control}
                    name="sponsorshipCategories"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.value)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([
                                    ...currentValues,
                                    item.value,
                                  ]);
                                } else {
                                  field.onChange(
                                    currentValues.filter(
                                      (value) => value !== item.value
                                    )
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Audience */}
        <FormField
          control={form.control}
          name="targetAudience"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  2. Target Audience *
                </FormLabel>
                <FormDescription className="text-sm text-muted-foreground">
                  What is your target exposure or audience?
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {targetAudienceOptions.map((item) => (
                  <FormField
                    key={item.value}
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.value)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([
                                    ...currentValues,
                                    item.value,
                                  ]);
                                } else {
                                  field.onChange(
                                    currentValues.filter(
                                      (value) => value !== item.value
                                    )
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Audience Others */}
        {targetAudience?.includes(SponsorshipAudience.OTHERS) && (
          <FormField
            control={form.control}
            name="targetAudienceOthers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Please specify your other target audience *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Describe your other target audience"
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
    </div>
  );
}
