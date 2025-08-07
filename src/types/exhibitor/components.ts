import { UseFormReturn } from "react-hook-form";
import { ExhibitorRegistrationFormData } from "./registration";

export interface ExhibitorMembershipProps {
  form: UseFormReturn<ExhibitorRegistrationFormData>;
}