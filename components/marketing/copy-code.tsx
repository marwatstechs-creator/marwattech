"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Promo code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy — select the code and copy manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-2 transition-colors hover:border-primary hover:bg-primary/10"
    >
      <code className="font-mono text-sm font-bold tracking-wide text-primary">
        {code}
      </code>
      <AppIcon name={copied ? "check" : "copy"} size={14} className="text-muted-foreground transition-colors group-hover:text-primary" />
    </button>
  );
}
