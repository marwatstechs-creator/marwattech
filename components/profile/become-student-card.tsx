"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  applyAsStudent,
  type StudentApplicationStatus,
} from "@/lib/actions/client/student";

/**
 * "Become a Student" card on the client profile. Reflects the current
 * application state and lets the user file/retry an application.
 */
export function BecomeStudentCard({
  status,
}: {
  status: StudentApplicationStatus;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (status === "approved") {
    return (
      <Card className="card-3d">
        <CardContent className="flex items-center gap-4 p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <AppIcon name="award" size={24} />
          </span>
          <div>
            <p className="font-display font-semibold">You&apos;re a student</p>
            <p className="text-sm text-muted-foreground">
              You have access to all courses and study materials.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "pending") {
    return (
      <Card className="card-3d">
        <CardContent className="flex items-center gap-4 p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold-foreground">
            <AppIcon name="clock" size={24} />
          </span>
          <div>
            <p className="font-display font-semibold">Application pending</p>
            <p className="text-sm text-muted-foreground">
              Your request to become a student is under review.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async () => {
    setPending(true);
    const res = await applyAsStudent(message);
    setPending(false);
    if (res.ok) {
      toast.success("Application submitted! We'll review it shortly.");
      setMessage("");
      window.location.reload();
    } else {
      toast.error(res.error || "Could not submit your application.");
    }
  };

  return (
    <Card className="card-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AppIcon name="award" size={20} className="text-primary" />
          Become a Student
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Apply to get access to all courses and study materials. Once approved,
          they&apos;ll appear in your dashboard.
        </p>
        {status === "rejected" && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Your previous application was not approved. You can apply again if
            you&apos;d like.
          </p>
        )}
        <Textarea
          placeholder="Why do you want to become a student? (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <Button onClick={onSubmit} disabled={pending} className="btn-3d">
          {pending ? "Submitting…" : "Apply to become a student"}
        </Button>
      </CardContent>
    </Card>
  );
}
