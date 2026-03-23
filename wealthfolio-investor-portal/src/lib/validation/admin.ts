import { z } from "zod";

export const investorMappingSchema = z.object({
  investorId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required."),
  username: z.string().trim().min(1, "Username is required."),
  email: z.union([z.string().trim().email("Email must be valid."), z.literal("")]).optional(),
  password: z.string().trim().min(1, "Password is required.").optional(),
  distributionAccountId: z.string().trim().min(1, "Distribution Account ID is required."),
  fundAssetId: z.string().trim().min(1, "Fund Asset ID is required."),
});
