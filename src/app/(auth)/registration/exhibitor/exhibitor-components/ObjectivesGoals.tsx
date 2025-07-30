import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExhibitorRegistrationFormData,
  goalTypeOptions,
  yesNoMaybeOptions,
} from "@/types/exhibitor/registration";

interface ObjectivesGoalsProps {
  form: UseFormReturn<ExhibitorRegistrationFormData>;
}

export function ObjectivesGoals({ form }: ObjectivesGoalsProps) {
  const goals = form.watch("goals") || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Company Goals */}
        <FormField
          control={form.control}
          name="goals"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  1. Company Goals & Objectives *
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  What do you hope to achieve by participating in BEACON 2025?
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goalTypeOptions.map((item) => (
                  <FormField
                    key={item.value}
                    control={form.control}
                    name="goals"
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
                                return checked
                                  ? field.onChange([...field.value, item.value])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.value
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
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

        {/* Show Others field if OTHERS is selected */}
        {goals.includes("OTHERS") && (
          <FormField
            control={form.control}
            name="goalsOthers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specify Other Goals *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Please specify your other goals and objectives"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Sponsorship Interest */}
        <FormField
          control={form.control}
          name="exploreSponsorship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>2. Interest in Sponsorship Opportunities</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="w-full md:max-w-56 overflow-hidden">
                    <SelectValue placeholder="Would you like to explore sponsorship opportunities?" />
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
              <FormLabel className="text-xs text-muted-foreground">
                Sponsorship opportunities include branding, speaking slots, and
                premium positioning
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
