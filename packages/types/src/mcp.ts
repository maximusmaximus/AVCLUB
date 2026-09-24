import { z } from "zod";
import { UserRoleSchema } from "./user";

export const McpToolScopeSchema = z.object({
  role: UserRoleSchema,
  allowedTools: z.array(z.string()),
});

export type McpToolScope = z.infer<typeof McpToolScopeSchema>;

export const ROLE_MCP_TOOLS: Record<string, string[]> = {
  PARTICIPANT: [
    "get_event_status",
    "get_current_phase",
    "list_presentations",
    "submit_presentation",
    "submit_ballot",
    "get_participation_history",
  ],
  PARTY_ONLY: [
    "get_event_status",
    "get_party_link",
  ],
  SUPPORTER: [
    "get_event_status",
    "get_supporter_digest",
    "get_participation_history",
  ],
  CO_SPONSOR: [
    "get_event_status",
    "get_supporter_digest",
    "get_participation_history",
    "view_sponsor_metrics",
  ],
  SPONSOR: [
    "upload_ad_asset",
    "preview_ad_viewport",
    "delegate_judge",
    "view_sponsor_metrics",
  ],
  JUDGE: [
    "get_event_status",
    "list_presentations",
    "submit_sponsor_award",
  ],
  STEWARD: [
    "verify_ticket",
    "lookup_attendee",
    "checkin_attendee",
    "get_door_stats",
  ],
  DOCENT: [
    "get_event_status",
    "get_stage_telemetry",
    "help_attendee",
  ],
  ADMIN: [
    "create_event",
    "advance_phase",
    "pause_phase",
    "resume_phase",
    "rewind_phase",
    "extend_phase",
    "cut_short_phase",
    "skip_phase",
    "approve_sponsor_ad",
    "reject_sponsor_ad",
    "revoke_steward",
    "trigger_refunds",
    "get_financial_ledger",
  ],
};
