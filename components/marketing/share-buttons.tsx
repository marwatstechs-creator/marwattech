"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AppIcon } from "@/components/app-icon";
import { ICONS, type IconName } from "@/lib/icons";
import { trackEvent } from "@/lib/analytics";

export function ShareButtons({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links: { label: string; icon: IconName; href: string }[] = [
    {
      label: "Share on Facebook",
      icon: "facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      label: "Share on X",
      icon: "twitter",
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    },
    {
      label: "Share on LinkedIn",
      icon: "linkedin",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    },
    {
      label: "Share on WhatsApp",
      icon: "whatsapp",
      href: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent("share", { method: "copy_link" });
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Share:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          onClick={() => trackEvent("share", { method: l.label })}
          className="grid size-8 place-items-center rounded-md border bg-card text-foreground/70 transition-colors hover:border-primary hover:text-primary"
        >
          <AppIcon name={l.icon} size={15} />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="grid size-8 place-items-center rounded-md border bg-card text-foreground/70 transition-colors hover:border-primary hover:text-primary"
      >
        <AppIcon name={copied ? "check" : "link"} size={15} />
      </button>
    </div>
  );
}

// keep ICONS referenced for tree-shaking clarity
void ICONS;
