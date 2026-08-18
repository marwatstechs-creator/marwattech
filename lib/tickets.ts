/**
 * Shared support-ticket status helpers.
 *
 * Server-safe (no "use client") so Server Components (admin/client dashboards)
 * and Client Components (ticket thread, ticket inbox) can all use them without
 * hitting "Attempted to call X from the server but X is on the client".
 */

export const TICKET_STATUSES = [
  { value: "new", label: "New", tone: "gold" as const },
  { value: "open", label: "Open", tone: "azure" as const },
  { value: "in_progress", label: "In progress", tone: "default" as const },
  { value: "waiting_on_customer", label: "Waiting on customer", tone: "outline" as const },
  { value: "resolved", label: "Resolved", tone: "default" as const },
  { value: "closed", label: "Closed", tone: "destructive" as const },
];

export type TicketStatusTone =
  | "default"
  | "gold"
  | "azure"
  | "outline"
  | "destructive"
  | "secondary";

export const STATUS_TONE: Record<string, TicketStatusTone> = {
  new: "gold",
  open: "azure",
  in_progress: "default",
  waiting_on_customer: "outline",
  resolved: "secondary",
  closed: "destructive",
};

export function statusTone(status: string): TicketStatusTone {
  return STATUS_TONE[status] ?? "outline";
}

export function statusLabel(status: string): string {
  return TICKET_STATUSES.find((s) => s.value === status)?.label ?? status;
}
