import { z } from "zod";

export const publishRequestSchema = z
  .object({
    masterPath: z.string().min(1).optional(),
    distributionPath: z.string().min(1).optional(),
  })
  .refine(
    (value) =>
      (!value.masterPath && !value.distributionPath) ||
      (Boolean(value.masterPath) && Boolean(value.distributionPath)),
    {
      message: "Both masterPath and distributionPath are required",
    },
  );
