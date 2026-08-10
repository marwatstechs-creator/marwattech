"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CareersForm } from "@/components/forms/careers-form";

export function JobApplyButton({
  careerId,
  position,
}: {
  careerId: string;
  position: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Apply Now
        <AppIcon name="arrowUpRight" size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for {position}</DialogTitle>
            <DialogDescription>
              Fill in the form below — we’ll review your application and get
              back to you within a few days.
            </DialogDescription>
          </DialogHeader>
          <CareersForm careerId={careerId} position={position} />
        </DialogContent>
      </Dialog>
    </>
  );
}
