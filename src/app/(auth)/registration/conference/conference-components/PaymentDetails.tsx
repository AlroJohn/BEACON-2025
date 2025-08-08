"use client";

import { useEffect, useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CreditCard,
  DollarSign,
  Info,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Building,
  Users,
  Upload,
  ImageIcon,
  Copy,
  CopyCheck,
} from "lucide-react";
import { PaymentDetailsProps } from "@/types/conference/components";
import { useConferenceRegistrationStore } from "@/hooks/standard-hooks/conference/useConferenceRegistrationStore";
import { toast } from "sonner";

export default function PaymentDetails({ form }: PaymentDetailsProps) {
  const {
    selectedEvents,
    totalAmount,

    requiresPayment,
    updateFormData,
    calculateTotalAmount,
  } = useConferenceRegistrationStore();
  const [paymentMethod, setPaymentMethod] = useState<string>("GCASH");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPrice = (price: number) => {
    return price === 0 ? "FREE" : `₱${price.toLocaleString()}`;
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Handle file selection for receipt upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const maxFileSize = 15 * 1024 * 1024; // 15MB
    // Validate file size (max 15MB)
    if (file.size > maxFileSize) {
      toast.error("Image size must be less than 15MB");
      return;
    }

    // Store file in form and clear any validation errors
    form.setValue("receiptImageUrl", file);
    form.clearErrors("receiptImageUrl");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Update form when payment method changes
  useEffect(() => {
    if (paymentMethod) {
      form.setValue("paymentMode", paymentMethod as any);
    }
  }, [paymentMethod, form]);

  // Watch for custom payment amount changes and recalculate total
  const customPaymentAmount = form.watch("customPaymentAmount");
  useEffect(() => {
    updateFormData({ customPaymentAmount });
    calculateTotalAmount();
  }, [customPaymentAmount, updateFormData, calculateTotalAmount]);

  // Watch for payment requirement changes and validate receipt and reference number
  const isMaritimeLeagueMember = form.watch("isMaritimeLeagueMember");
  const receiptImageUrl = form.watch("receiptImageUrl");
  const referenceNumber = form.watch("referenceNumber");

  useEffect(() => {
    const needsPayment = isMaritimeLeagueMember === "NO" && totalAmount > 0;

    // Validate receipt
    if (needsPayment && !receiptImageUrl) {
      form.setError("receiptImageUrl", {
        type: "manual",
        message: "Payment receipt is required for registration",
      });
    } else if (receiptImageUrl && form.formState.errors.receiptImageUrl) {
      form.clearErrors("receiptImageUrl");
    }

    // Validate reference number
    if (
      needsPayment &&
      (!referenceNumber || referenceNumber.trim().length === 0)
    ) {
      form.setError("referenceNumber", {
        type: "manual",
        message: "Reference number is required for payment verification",
      });
    } else if (
      referenceNumber &&
      referenceNumber.trim().length > 0 &&
      form.formState.errors.referenceNumber
    ) {
      form.clearErrors("referenceNumber");
    }
  }, [
    isMaritimeLeagueMember,
    totalAmount,
    receiptImageUrl,
    referenceNumber,
    form,
  ]);

  // If no payment required (TML member), show confirmation
  if (!requiresPayment) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Payment Information
          </h3>
          <p className="text-sm text-muted-foreground">
            Your payment information and TML member benefits.
          </p>
        </div>

        <Card className="border-green-200 ">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 ">
              <Users className="h-4 w-4" />
              TML Member Benefits Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="">Registration Status:</span>
                <Badge className="bg-green-600 text-white">
                  FREE - TML Member
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="">Total Events Selected:</span>
                <span className="font-medium ">{selectedEvents.length}</span>
              </div>
              {totalAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="">Total Savings:</span>
                  <span className="font-bold ">{formatPrice(totalAmount)}</span>
                </div>
              )}
              <Alert className="border-green-300 bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="">
                  As a verified TML member, all conference events are
                  complimentary. No payment is required to complete your
                  registration.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pricing Summary */}
      {selectedEvents.length > 0 && (
        <Card className="border-blue-200 dark:bg-c1/30 bg-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pricing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const attendingDays = form.watch("attendingDays") || {};
                let conferenceTotal = 0;
                let otherEventsTotal = 0;
                let conferenceDaysCount = 0;
                const breakdown: Array<{
                  name: string;
                  days: number;
                  pricePerDay: number;
                  total: number;
                  isConference: boolean;
                }> = [];

                selectedEvents.forEach((event) => {
                  const selectedDates = attendingDays[event.name] || [];
                  const daysSelected = Array.isArray(selectedDates)
                    ? selectedDates.length
                    : 0;

                  if (daysSelected > 0) {
                    const eventTotal = daysSelected * event.price;
                    // Assuming we can determine if it's a conference event from the store or form
                    const isConference = true; // This should be determined based on event data

                    breakdown.push({
                      name: event.name,
                      days: daysSelected,
                      pricePerDay: event.price,
                      total: eventTotal,
                      isConference,
                    });

                    if (isConference) {
                      conferenceTotal += eventTotal;
                      conferenceDaysCount += daysSelected;
                    } else {
                      otherEventsTotal += eventTotal;
                    }
                  }
                });

                const hasDiscount = conferenceDaysCount >= 3;
                const discount = hasDiscount ? 1500 : 0;
                const finalTotal =
                  conferenceTotal + otherEventsTotal - discount;

                return (
                  <>
                    {breakdown.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-1"
                      >
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          {item.isConference && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              CONFERENCE
                            </Badge>
                          )}
                          <div className=" text-xs">
                            {item.days} day{item.days > 1 ? "s" : ""} ×{" "}
                            {formatPrice(item.pricePerDay)}
                          </div>
                        </div>
                        <div className="font-medium">
                          {formatPrice(item.total)}
                        </div>
                      </div>
                    ))}

                    {breakdown.length > 0 && (
                      <>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>
                              {formatPrice(conferenceTotal + otherEventsTotal)}
                            </span>
                          </div>

                          {hasDiscount && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>
                                Conference Discount ({conferenceDaysCount}{" "}
                                days):
                              </span>
                              <span>-{formatPrice(discount)}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                            <span>Total Amount Due:</span>
                            <span className="text-blue-600">
                              {formatPrice(finalTotal)}
                            </span>
                          </div>
                        </div>

                        {hasDiscount && (
                          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            You saved ₱1,500 for selecting 3+ conference days!
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Selection */}

      <FormField
        control={form.control}
        name="paymentMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              1. Select Payment Method
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  field.onChange(value);
                }}
                value={field.value || paymentMethod}
                className="flex flex-col space-y-3 mt-2"
              >
                <div className="flex-1 flex items-center gap-3">
                  <RadioGroupItem value="GCASH" id="gcash" />
                  <label htmlFor="gcash" className="font-medium cursor-pointer">
                    GCash
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Pay via GCash mobile app or online
                  </p>
                </div>

                <div className="flex-1 flex items-center gap-3">
                  <RadioGroupItem value="BANK_DEPOSIT_TRANSFER" id="bank" />
                  <label htmlFor="bank" className="font-medium cursor-pointer">
                    Bank Transfer
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Online banking or over-the-counter transfer
                  </p>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* GCash Payment Details */}
      {paymentMethod === "GCASH" && (
        <Card className="border-blue-200 dark:bg-c1/30 bg-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base  flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              GCash Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative max-w-xs flex flex-col gap-4 justify-center items-center">
                  <img
                    src="/images/instapay.jpg"
                    alt="InstaPay QR Code"
                    className="w-full h-auto rounded-lg border border-blue-200 shadow-sm"
                  />
                  <div className="w-full flex md:flex-row flex-col md:items-center items-start justify-start gap-2">
                    <span className="uppercase font-medium lg:text-2xl text-xl whitespace-nowrap text-red-500">
                      GCASH No.
                    </span>{" "}
                    <div className="flex gap-2 flex-row items-center">
                      <p className="lg:text-2xl text-xl font-medium">
                        09173114147
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard("09369118818", "Gcash Number")
                        }
                        className="text-green-600 hover:text-green-700"
                      >
                        {copiedField === "Gcash Number" ? (
                          <CopyCheck className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <Alert className="border-blue-300 dark:bg-c1/30 bg-muted">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-accent-foreground">
                  <strong>How to pay:</strong> Scan the QR code above using your
                  GCash app or send payment to the InstaPay details shown. After
                  payment, upload your receipt below for verification.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Transfer Payment Details */}
      {paymentMethod === "BANK_DEPOSIT_TRANSFER" && (
        <Card className="border-green-200 dark:bg-c1/30 bg-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base  flex items-center gap-2">
              <Building className="h-4 w-4" />
              Bank Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className=" p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold  mb-3">
                  THE MARITIME LEAGUE, INC.
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm ">Account Name</p>
                      <p className="font-medium">The Maritime League, Inc.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "The Maritime League, Inc.",
                          "Account Name"
                        )
                      }
                      className="text-green-600 hover:text-green-700"
                    >
                      {copiedField === "Account Name" ? (
                        <CopyCheck className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm ">BPI Current Account</p>
                      <p className="font-medium font-mono">0091-0683-03</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard("0091-0683-03", "Account Number")
                      }
                      className="text-green-600 hover:text-green-700"
                    >
                      {copiedField === "Account Number" ? (
                        <CopyCheck className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm ">Branch</p>
                      <p className="font-medium">
                        Pasong Tamo Extension Branch, Makati City
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "Pasong Tamo Extension Branch, Makati City",
                          "Branch"
                        )
                      }
                      className="text-green-600 hover:text-green-700"
                    >
                      {copiedField === "Branch" ? (
                        <CopyCheck className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert className="border-green-300">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-accent-foreground">
                  <strong>Instructions:</strong> Deposit your payment to the
                  account above. After making the deposit, upload a copy of your
                  deposit slip below for verification.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Payment Amount (if needed) */}

      {/* Payment Summary */}
      <Card className="dark:bg-c1/30 bg-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-base  dark:text-white">
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base Amount:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            {customPaymentAmount && parseFloat(customPaymentAmount) > 0 && (
              <div className="flex justify-between">
                <span>Additional Donation:</span>
                <span>₱{parseFloat(customPaymentAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold  dark:text-green-500">
              <span>Total Amount:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Upload Section */}
      <Card
        className={`border-orange-200 bg-orange-50 dark:bg-c1/30 dark:border-c1 ${
          form.formState.errors.receiptImageUrl
            ? "border-red-300 bg-red-50"
            : ""
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className={`text-base flex items-center gap-2 ${
              form.formState.errors.receiptImageUrl
                ? "text-red-800 dark:text-red-400"
                : "text-orange-800 dark:text-white"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload Payment Receipt *{" "}
            {form.formState.errors.receiptImageUrl && "(Required)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert
              className={`${
                form.formState.errors.receiptImageUrl
                  ? "border-red-300 bg-red-100"
                  : "border-orange-300 bg-orange-100"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 ${
                  form.formState.errors.receiptImageUrl
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              />
              <AlertDescription
                className={`${
                  form.formState.errors.receiptImageUrl
                    ? "text-red-800"
                    : "text-orange-800"
                }`}
              >
                <strong>Required:</strong> Please upload your payment receipt
                for verification. Without a valid receipt, your registration
                cannot be processed.
              </AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="receiptImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Image</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full h-32 border-dashed hover:border-orange-400 ${
                          form.formState.errors.receiptImageUrl
                            ? "border-red-300 hover:border-red-400"
                            : "border-orange-300"
                        }`}
                      >
                        {previewUrl ? (
                          <div className="flex flex-col items-center gap-2">
                            <ImageIcon className="w-6 h-6 text-orange-600 dark:text-white" />
                            <span className="text-sm text-orange-800 dark:text-white">
                              Receipt Uploaded
                            </span>
                            <span className="text-xs text-orange-600 dark:text-white">
                              Click to change
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-6 h-6 text-orange-600 dark:text-white" />
                            <span className="text-sm text-orange-800 dark:text-white">
                              Click to select receipt
                            </span>
                            <span className="text-xs text-orange-600 dark:text-white">
                              PNG, JPG up to 15MB
                            </span>
                          </div>
                        )}
                      </Button>

                      {previewUrl && (
                        <div className="relative justify-center items-center flex">
                          <img
                            src={previewUrl}
                            alt="Receipt preview"
                            className="w-full lg:max-w-sm max-w-md  object-contain rounded-md border border-orange-200"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={
                      form.formState.errors.referenceNumber
                        ? "text-red-700"
                        : ""
                    }
                  >
                    Reference Number *{" "}
                    {form.formState.errors.referenceNumber && "(Required)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Enter transaction reference number"
                      className={`focus:border-orange-400 ${
                        form.formState.errors.referenceNumber
                          ? "border-red-300 focus:border-red-400 bg-red-50"
                          : "border-orange-200"
                      }`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hidden field for total payment amount */}
      <FormField
        control={form.control}
        name="totalPaymentAmount"
        render={({ field }) => {
          // Update form value with the store's calculated total
          useEffect(() => {
            field.onChange(totalAmount);
          }, [totalAmount, field]);

          return <input type="hidden" {...field} value={totalAmount} />;
        }}
      />
    </div>
  );
}
