import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sponsorRegistrationSchema,
  defaultSponsorRegistrationValues,
  SponsorRegistrationFormData,
} from "@/types/sponsors/registration";

export const useSponsorRegistrationSchema = () => {
  const form = useForm<SponsorRegistrationFormData>({
    resolver: zodResolver(sponsorRegistrationSchema),
    defaultValues: defaultSponsorRegistrationValues,
    mode: "onChange",
  });

  return form;
};

export type { SponsorRegistrationFormData };