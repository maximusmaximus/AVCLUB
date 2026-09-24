import { z } from "zod";

export const UserRoleSchema = z.enum([
  "PARTICIPANT",
  "PARTY_ONLY",
  "SUPPORTER",
  "CO_SPONSOR",
  "SPONSOR",
  "JUDGE",
  "STEWARD",
  "DOCENT",
  "ADMIN",
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1, "Name cannot be empty"),
  avatarUrl: z.string().url().optional().nullable(),
  googleId: z.string().optional().nullable(),
  ageVerified18Plus: z.boolean().default(false),
  isProfilePublic: z.boolean().default(true),
  roles: z.array(UserRoleSchema).default(["PARTICIPANT"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const SignupInputSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  ageVerified18Plus: z.literal(true, {
    errorMap: () => ({ message: "You must be 18 or older to join AVCLUB." }),
  }),
  isProfilePublic: z.boolean().default(true),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms, late policy, and refund rules." }),
  }),
  supporterDigestOptIn: z.boolean().default(false),
});

export type SignupInput = z.infer<typeof SignupInputSchema>;
