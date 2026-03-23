import { z } from "zod";

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    username: z.string().trim().min(1).optional(),
    password: z.string().min(1),
  })
  .transform((value) => ({
    identifier: value.identifier ?? value.username ?? "",
    password: value.password,
  }))
  .pipe(
    z.object({
      identifier: z.string().trim().min(1),
      password: z.string().min(1),
    }),
  );
