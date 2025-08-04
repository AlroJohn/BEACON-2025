"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail } from "lucide-react";
import { ConsentAndConfirmationProps } from "@/types/conference/components";
import { TermsModal } from "../../../../../components/reuseable/page-components/TermsModal";

export default function ConsentAndConfirmation({
  form,
}: ConsentAndConfirmationProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Data Usage Consent - Required */}
        <div className="space-y-4">
          <div className="flex lg:flex-row flex-col justify-between space-y-2">
            <h4 className="text-base font-semibold">2. Data Privacy Consent</h4>
            <TermsModal />
          </div>

          <FormField
            control={form.control}
            name="dataUsageConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="leading-5 ">
                    I consent to the collection and processing of my personal
                    data in accordance with the Data Privacy Act and agree to
                    the Terms & Conditions. *
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email Certificate */}

        <FormField
          control={form.control}
          name="emailCertificate"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <div className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-2 leading-none">
                  <FormLabel className="flex items-center gap-2 text-base font-medium cursor-pointer text-green-900  dark:text-accent-foreground">
                    <Mail className="h-4 w-4" />
                    Digital Certificate Request
                  </FormLabel>
                  <FormDescription className="text-sm text-green-700">
                    I would like to receive a digital certificate of attendance
                    via email after the conference. This certificate will be
                    sent to the email address provided in my registration.
                  </FormDescription>
                  <span className="text-xs text-green-600">
                    Free digital certificate via email
                  </span>
                </div>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
