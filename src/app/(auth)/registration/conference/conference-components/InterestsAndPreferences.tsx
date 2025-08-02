"use client";

import { useState } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { conferenceInterestAreasOptions } from "@/types/conference/registration";
import { InterestsAndPreferencesProps } from "@/types/conference/components";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function InterestsAndPreferences({
  form,
}: InterestsAndPreferencesProps) {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  
  const toggleExpansion = (areaValue: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaValue)) {
      newExpanded.delete(areaValue);
    } else {
      newExpanded.add(areaValue);
    }
    setExpandedAreas(newExpanded);
  };

  const handleSubInterestChange = (areaLabel: string, subInterest: string, checked: boolean) => {
    const currentDetailedInterests = form.getValues("detailedInterests") || {};
    const currentSubInterests = currentDetailedInterests[areaLabel] || [];
    
    if (checked) {
      const updatedSubInterests = [...currentSubInterests, subInterest];
      form.setValue("detailedInterests", {
        ...currentDetailedInterests,
        [areaLabel]: updatedSubInterests
      });
    } else {
      const updatedSubInterests = currentSubInterests.filter(item => item !== subInterest);
      if (updatedSubInterests.length === 0) {
        const { [areaLabel]: _, ...remainingInterests } = currentDetailedInterests;
        form.setValue("detailedInterests", remainingInterests);
      } else {
        form.setValue("detailedInterests", {
          ...currentDetailedInterests,
          [areaLabel]: updatedSubInterests
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Interest Areas */}
        <FormField
          control={form.control}
          name="interestAreas"
          render={() => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">
                  1. Areas of Interest *
                </FormLabel>
                <FormMessage />
              </div>
              <FormDescription>
                Select the main areas that interest you, then choose specific sub-topics within each area.
              </FormDescription>
              <FormControl>
                <div className="space-y-4">
                  {conferenceInterestAreasOptions.map((item) => (
                    <div key={item.value} className="border rounded-lg p-4">
                      <FormField
                        control={form.control}
                        name="interestAreas"
                        render={({ field }) => {
                          const isAreaSelected = field.value?.includes(item.value);
                          const isExpanded = expandedAreas.has(item.value);
                          const detailedInterests = form.watch("detailedInterests") || {};
                          const selectedSubInterests = detailedInterests[item.label] || [];

                          return (
                            <div className="space-y-3">
                              {/* Main Area Checkbox */}
                              <div className="flex items-start justify-between">
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={isAreaSelected}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValues, item.value]);
                                          // Auto-expand when selected
                                          if (item.subInterests.length > 0) {
                                            setExpandedAreas(prev => new Set([...prev, item.value]));
                                          }
                                        } else {
                                          field.onChange(currentValues.filter(value => value !== item.value));
                                          // Clear detailed interests for this area
                                          const { [item.label]: _, ...remainingInterests } = detailedInterests;
                                          form.setValue("detailedInterests", remainingInterests);
                                          // Collapse when unselected
                                          setExpandedAreas(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(item.value);
                                            return newSet;
                                          });
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <div className="flex-1">
                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                      {item.label}
                                    </FormLabel>
                                    {selectedSubInterests.length > 0 && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        {selectedSubInterests.length} sub-interest{selectedSubInterests.length > 1 ? 's' : ''} selected
                                      </div>
                                    )}
                                  </div>
                                </FormItem>
                                
                                {/* Expand/Collapse Button */}
                                {isAreaSelected && item.subInterests.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpansion(item.value)}
                                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="h-4 w-4 mr-1" />
                                        Hide sub-topics
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-4 w-4 mr-1" />
                                        Show sub-topics
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Sub-interests */}
                              {isAreaSelected && item.subInterests.length > 0 && (
                                <Collapsible open={isExpanded}>
                                  <CollapsibleContent className="pt-3 border-t border-gray-200">
                                    <div className="pl-6 space-y-2">
                                      <p className="text-sm font-medium text-gray-700 mb-3">
                                        Select specific areas within {item.label}:
                                      </p>
                                      <div className="grid gap-2">
                                        {item.subInterests.map((subInterest, index) => (
                                          <label key={index} className="flex items-start space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
                                            <Checkbox
                                              checked={selectedSubInterests.includes(subInterest)}
                                              onCheckedChange={(checked) => 
                                                handleSubInterestChange(item.label, subInterest, checked as boolean)
                                              }
                                            />
                                            <span className="text-sm text-gray-700 leading-relaxed">
                                              {subInterest}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Detailed Interests Display (Hidden field for form) */}
        <FormField
          control={form.control}
          name="detailedInterests"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Other Interests */}
        <FormField
          control={form.control}
          name="otherInterests"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  2. Other Interests or Comments
                </FormLabel>
                <FormMessage />
              </div>
              <FormDescription>
                Please specify any other areas of interest not covered above.
              </FormDescription>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Type your other interests, comments, or specific topics you'd like to learn about..."
                  className="min-h-[100px] resize-none"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Event Invites */}
        <FormField
          control={form.control}
          name="receiveEventInvites"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  3. Future Event Notifications
                </FormLabel>
                <FormDescription>
                  I would like to receive invitations and updates about future
                  maritime events and conferences.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}