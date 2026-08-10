import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "gold" | "outline" | "azure" }> = {
    published: { label: "Published", variant: "default" },
    draft: { label: "Draft", variant: "outline" },
    archived: { label: "Archived", variant: "secondary" },
    new: { label: "New", variant: "gold" },
    read: { label: "Read", variant: "outline" },
    replied: { label: "Replied", variant: "azure" },
    reviewed: { label: "Reviewed", variant: "azure" },
    interview: { label: "Interview", variant: "gold" },
    rejected: { label: "Rejected", variant: "secondary" },
    hired: { label: "Hired", variant: "default" },
  };
  const config = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
