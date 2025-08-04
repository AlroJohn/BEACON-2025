"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Zap, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const bulkGenerateSchema = z.object({
  count: z.number()
    .int("Count must be an integer")
    .min(1, "Count must be at least 1")
    .max(1000, "Cannot generate more than 1000 codes at once"),
  isActive: z.boolean(),
});

type BulkGenerateFormData = z.infer<typeof bulkGenerateSchema>;

interface BulkGenerateCodesDialogProps {
  trigger: React.ReactNode;
  onCodesGenerated: () => void;
}

interface GenerationResult {
  requested: number;
  created: number;
  active: boolean;
}

export function BulkGenerateCodesDialog({ 
  trigger, 
  onCodesGenerated,
}: BulkGenerateCodesDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState(0);

  const form = useForm<BulkGenerateFormData>({
    resolver: zodResolver(bulkGenerateSchema),
    defaultValues: {
      count: 50,
      isActive: false,
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isGenerating) {
      // Reset form and state when closing dialog
      form.reset();
      setGenerationResult(null);
      setProgress(0);
    }
    setOpen(newOpen);
  };

  const onSubmit = async (data: BulkGenerateFormData) => {
    setIsGenerating(true);
    setProgress(0);
    setGenerationResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch("/api/codes/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate TML codes");
      }

      const result = await response.json();
      setProgress(100);
      
      setGenerationResult({
        requested: data.count,
        created: result.data.summary.created,
        active: data.isActive,
      });

      toast.success(`Successfully generated ${result.data.summary.created} TML codes!`);
      onCodesGenerated();

    } catch (error) {
      console.error("Error generating bulk TML codes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate TML codes");
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Bulk Generate TML Codes
          </DialogTitle>
          <DialogDescription>
            Generate multiple random TML member codes at once. Specify the quantity and status.
          </DialogDescription>
        </DialogHeader>

        {!generationResult ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Count Input */}
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Codes *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Enter number of codes" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isGenerating}
                        min="1"
                        max="1000"
                      />
                    </FormControl>
                    <FormDescription>
                      Generate between 1 and 1000 TML codes (recommended: 50-200 for optimal performance)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Codes</FormLabel>
                      <FormDescription>
                        Set all generated codes as active (can be used immediately) or inactive (requires manual activation)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isGenerating}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Progress Bar */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Generating codes...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Warning for large numbers */}
              {form.watch("count") > 200 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Generating {form.watch("count")} codes may take a few moments. Please be patient and don't close the dialog.
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Codes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          /* Success Result Display */
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  TML Codes Generated Successfully!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your TML member codes have been created and are ready to use.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {generationResult.created}
                </div>
                <div className="text-sm text-muted-foreground">
                  Codes Created
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {generationResult.active ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Initial Status
                </div>
              </div>
            </div>

            {generationResult.created !== generationResult.requested && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Note: {generationResult.requested - generationResult.created} codes could not be generated due to uniqueness constraints.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}