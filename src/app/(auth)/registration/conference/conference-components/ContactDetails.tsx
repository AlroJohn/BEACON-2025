"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ContactDetailsProps } from "@/types/conference/components";
import { useEmailValidation } from "@/hooks/tanstasck-query/useEmailValidation";

export default function ContactDetails({ form }: ContactDetailsProps) {
  const email = form.watch("email");
  const { data: emailCheck, isLoading: emailLoading } =
    useEmailValidation(email, 'conference');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="flex items-center gap-2">
                    1. Email Address *
                  </FormLabel>
                </div>

                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="your.email@example.com"
                      className={`text-base pr-10 ${
                        emailCheck?.exists
                          ? "border-red-500 focus-visible:ring-red-500"
                          : email &&
                            email.includes("@") &&
                            !emailCheck?.exists &&
                            !emailLoading
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                      }`}
                    />
                  </FormControl>
                  {email && email.includes("@") && email.length > 5 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : emailCheck?.exists ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  )}
                </div>

                {emailCheck?.exists && (
                  <Alert variant="destructive" className="py-2 bg-background">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      This email is already registered for conference registration.
                    </AlertDescription>
                  </Alert>
                )}

                {email &&
                  email.includes("@") &&
                  email.length > 5 &&
                  !emailCheck?.exists &&
                  !emailLoading && (
                    <Alert className="py-2 border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-sm text-green-600">
                        Email is available!
                      </AlertDescription>
                    </Alert>
                  )}
              </FormItem>
            )}
          />

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
        </div>

        {/* Mailing Address */}
        <FormField
          control={form.control}
          name="mailingAddress"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  3. Mailing Address
                </FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Enter your complete mailing address..."
                  className="min-h-[100px] resize-none"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
