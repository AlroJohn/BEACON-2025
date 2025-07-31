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
import { Label } from "@/components/ui/label";
import {
  SponsorRegistrationFormData,
  budgetRangeOptions,
  proposalOptionOptions,
} from "@/types/sponsors/registration";
import { Upload, X } from "lucide-react";
import { useSponsorRegistrationStore } from "@/hooks/standard-hooks/sponsor/useSponsorRegistrationStore";
import { Button } from "@/components/ui/button";

interface BudgetProposalProps {
  form: UseFormReturn<SponsorRegistrationFormData>;
}

export function BudgetProposal({ form }: BudgetProposalProps) {
  const { logoFile, setLogoFile } = useSponsorRegistrationStore();

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload only JPG, PNG, or PDF files");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setLogoFile(file);
    }
  };

  const removeLogoFile = () => {
    setLogoFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 grid-cols-1">
          {/* Budget Range */}
          <FormField
            control={form.control}
            name="budgetRange"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>1. Sponsorship Budget Range *</FormLabel>
                <p className="text-sm text-muted-foreground mb-3">
                  What is your estimated budget range for this sponsorship
                  opportunity?
                </p>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full overflow-hidden">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {budgetRangeOptions.map((option) => (
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
        <div className="grid md:grid-cols-2 grid-cols-1">
          {/* Customized Proposal */}
          <FormField
            control={form.control}
            name="customizedProposal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>2. Customized Sponsorship Proposal *</FormLabel>
                <p className="text-sm text-muted-foreground mb-3">
                  Would you like to receive a customized sponsorship proposal?
                </p>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full overflow-hidden">
                      <SelectValue placeholder="Select your preference" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {proposalOptionOptions.map((option) => (
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

        {/* Logo Upload */}
        <div className="space-y-3">
          <Label>3. Company Logo (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Upload your company logo for the sponsorship proposal (JPG, PNG, or
            PDF, max 5MB)
          </p>

          {!logoFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                  <input
                    id="logo-upload"
                    type="file"
                    className="sr-only"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleLogoUpload}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, PDF up to 5MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {logoFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(logoFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={removeLogoFile}
                className="flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Additional Comments */}
        <FormField
          control={form.control}
          name="additionalComments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Additional Comments or Requirements</FormLabel>
              <p className="text-sm text-muted-foreground mb-3">
                Share any specific requirements, expectations, or additional
                information
              </p>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional comments, special requirements, or expectations..."
                  className="min-h-[120px]"
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
