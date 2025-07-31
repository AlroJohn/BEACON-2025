"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  FileWarning,
  MessageCircleWarning,
  MessageCircleWarningIcon,
} from "lucide-react";

export function SponsorAds() {
  return (
    <Card className="mb-4 dark:bg-c1/30 bg-muted">
      <CardContent>
        <div className="flex items-start gap-2">
          <Icon
            icon="ri:information-line"
            className="w-6 h-6 min-h-6 min-w-6"
            width="24"
            height="24"
          />
          <div className="flex flex-col gap-1">
            <span className="mb-2 font-semibold">
              Why Sponsor BEACON EXPO 2025?
            </span>

            <ul className="list-disc lg:pl-4">
              <li className="ml-4">
                Unmatched visibility at a multi-sector blue economy platform
              </li>
              <li className="ml-4">
                Access to key government and private decision-makers
              </li>

              {/* No bullet for this header line */}
              <li className="ml-4 list-none">
                <span>
                  Integrated branding across 4 major co-located events:
                </span>
                <ul className="mt-1 ml-6 list-disc">
                  <li>Philippine Shipping & Shipbuilding Expo (PHILSHIPCON)</li>
                  <li>BIAP Manila International Boat Show</li>
                  <li>Maritime Logistic Supply Expo 2025</li>
                  <li>Manning Expo & Conference 2025</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
