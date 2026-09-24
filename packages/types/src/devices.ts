import { z } from "zod";
import { UserRoleSchema } from "./user";

export const PairedDeviceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceLabel: z.string().min(1),
  role: UserRoleSchema,
  isLocked: z.boolean().default(false),
  failedAttempts: z.number().default(0),
  lastHeartbeat: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
});

export type PairedDevice = z.infer<typeof PairedDeviceSchema>;

export const DevicePairingRequestSchema = z.object({
  userId: z.string().uuid(),
  pairingPin: z.string().length(6, "PIN must be exactly 6 digits"),
  deviceLabel: z.string().min(1),
  deviceRole: UserRoleSchema,
});

export type DevicePairingRequest = z.infer<typeof DevicePairingRequestSchema>;
