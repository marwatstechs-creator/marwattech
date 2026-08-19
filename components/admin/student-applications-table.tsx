"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { reviewStudentApplication } from "@/lib/actions/admin/student-applications";
import { timeAgo } from "@/lib/utils";

type ApplicationRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const STATUS_VARIANT: Record<ApplicationRow["status"], "default" | "gold" | "destructive"> = {
  pending: "gold",
  approved: "default",
  rejected: "destructive",
};

export function StudentApplicationsTable({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  const [apps, setApps] = useState(applications);

  const review = async (id: string, approve: boolean) => {
    const res = await reviewStudentApplication(id, approve);
    if (res.ok) {
      toast.success(
        approve ? "Approved — user is now a student" : "Application rejected"
      );
      setApps((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: approve ? "approved" : "rejected" } : a
        )
      );
    } else {
      toast.error(res.error || "Could not update the application.");
    }
  };

  if (apps.length === 0) {
    return (
      <Card className="card-3d">
        <CardContent className="p-12 text-center text-muted-foreground">
          No student applications yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {apps.map((a) => (
        <Card key={a.id} className="card-3d">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-semibold">
                  {a.full_name || "Unknown"}
                </span>
                <Badge variant={STATUS_VARIANT[a.status]} className="uppercase">
                  {a.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{a.email}</p>
              {a.message && (
                <p className="text-sm text-muted-foreground">“{a.message}”</p>
              )}
              <p className="text-xs text-muted-foreground">
                Applied {timeAgo(a.created_at)}
              </p>
            </div>
            {a.status === "pending" && (
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  className="btn-3d"
                  onClick={() => review(a.id, true)}
                >
                  <AppIcon name="check" size={14} />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => review(a.id, false)}
                >
                  <AppIcon name="close" size={14} />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
