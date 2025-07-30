import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
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
  participationTypeOptions,
  boothSizeOptions,
  yesNoMaybeOptions,
} from "@/types/exhibitor/registration";

interface ExhibitionPackageProps {
  form: UseFormReturn<ExhibitorRegistrationFormData>;
}

export function ExhibitionPackage({ form }: ExhibitionPackageProps) {
  const participationTypes = form.watch("participationTypes") || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Participation Types */}
        <FormField
          control={form.control}
          name="participationTypes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  1. Participation Types *
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select all that apply to your exhibition needs
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {participationTypeOptions.map((item) => (
                  <FormField
                    key={item.value}
                    control={form.control}
                    name="participationTypes"
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

        {/* Booth Size - Show only if Indoor Booth or Raw Space is selected */}
        {(participationTypes.includes("INDOOR_BOOTH") ||
          participationTypes.includes("RAW_SPACE")) && (
          <FormField
            control={form.control}
            name="boothSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booth Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select booth size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {boothSizeOptions.map((option) => (
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
        )}

        {/* Booth Description */}
        <FormField
          control={form.control}
          name="boothDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>2. Booth Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your booth setup, products/services to be displayed, and any special requirements"
                  className="min-h-[100px]"
                  maxLength={1000}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-muted-foreground text-right">
                {field.value?.length || 0}/1000 characters
              </div>
            </FormItem>
          )}
        />

        {/* Product Launch and Demo Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="launchNewProduct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>3. Launching New Product/Service?</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select option" />
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

          <FormField
            control={form.control}
            name="requireDemoArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>4. Require Demo/Presentation Area?</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select option" />
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
      </div>
    </div>
  );
}
