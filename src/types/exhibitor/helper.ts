import { Prisma } from '@prisma/client';
import { baseExhibitorSchema } from './registration';

// Only fields that belong to exhibitor_registrations
export const exhibitorOnlySchema = baseExhibitorSchema.pick({
    companyName: true,
    businessRegistrationName: true,
    industrySector: true,
    industrySectorOthers: true,
    companyAddress: true,
    companyWebsite: true,
    companyProfile: true,
    participationTypes: true,
    boothSize: true,
    boothDescription: true,
    launchNewProduct: true,
    requireDemoArea: true,
    bringLargeEquipment: true,
    haveMarketingCollaterals: true,
    logoUrl: true,
    goals: true,
    goalsOthers: true,
    exploreSponsorship: true,
    confirmIntent: true,
    letterOfIntentUrl: true,
    additionalComments: true,
}).partial();

export const nullIfEmpty = (s?: string | null) =>
    s === undefined ? undefined : s === null ? null : s.trim() === '' ? null : s;

export const toNullableSet = (v: string | null | undefined) =>
    v === undefined ? undefined : ({ set: v } as const);
