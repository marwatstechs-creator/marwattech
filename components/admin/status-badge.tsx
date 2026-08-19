import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "gold" | "outline" | "azure" | "destructive" }> = {
    // Content
    published: { label: "Published", variant: "default" },
    draft: { label: "Draft", variant: "outline" },
    archived: { label: "Archived", variant: "secondary" },
    // Contact / inbox
    new: { label: "New", variant: "gold" },
    read: { label: "Read", variant: "outline" },
    replied: { label: "Replied", variant: "azure" },
    // Tickets
    open: { label: "Open", variant: "azure" },
    in_progress: { label: "In progress", variant: "default" },
    waiting_on_customer: { label: "Waiting on customer", variant: "outline" },
    resolved: { label: "Resolved", variant: "secondary" },
    closed: { label: "Closed", variant: "destructive" },
    // Applications
    reviewed: { label: "Reviewed", variant: "azure" },
    interview: { label: "Interview", variant: "gold" },
    rejected: { label: "Rejected", variant: "secondary" },
    hired: { label: "Hired", variant: "default" },
    // Clients / projects
    active: { label: "Active", variant: "default" },
    inactive: { label: "Inactive", variant: "outline" },
    lead: { label: "Lead", variant: "gold" },
    planning: { label: "Planning", variant: "azure" },
    review: { label: "In review", variant: "gold" },
    completed: { label: "Completed", variant: "secondary" },
    cancelled: { label: "Cancelled", variant: "destructive" },
    // Payments
    pending: { label: "Pending", variant: "gold" },
    confirmed: { label: "Confirmed", variant: "azure" },
    failed: { label: "Failed", variant: "destructive" },
    refunded: { label: "Refunded", variant: "secondary" },
  };
  const config = map[status] ?? { label: status.replace(/_/g, " "), variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
