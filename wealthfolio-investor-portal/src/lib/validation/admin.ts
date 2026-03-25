import { z } from "zod";

const emailSchema = z
  .union([z.string().trim().email("Email must be valid."), z.literal(""), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : value))
  .transform((value) => (value ? value : undefined));

const passwordSchema = z.string().trim().min(1, "Password is required.");

const optionalPasswordSchema = z
  .union([z.string(), z.undefined()])
  .transform((value) => value?.trim() ?? "")
  .transform((value) => (value ? value : undefined));

const investorMappingFields = {
  name: z.string().trim().min(1, "Name is required."),
  username: z.string().trim().min(1, "Username is required."),
  email: emailSchema,
  distributionAccountId: z.string().trim().min(1, "Distribution Account ID is required."),
  fundAssetId: z.string().trim().min(1, "Fund Asset ID is required."),
};

export const createInvestorSchema = z.object({
  ...investorMappingFields,
  password: passwordSchema,
});

export const updateInvestorSchema = z.object({
  investorId: z.string().uuid("Investor ID must be valid."),
  ...investorMappingFields,
  password: optionalPasswordSchema,
});

export const investorMappingSchema = z.union([createInvestorSchema, updateInvestorSchema]);

export const toggleInvestorStatusSchema = z.object({
  isActive: z.boolean(),
});

export const deleteInvestorSchema = z.object({
  usernameConfirmation: z.string().trim().min(1, "Username confirmation is required."),
});
