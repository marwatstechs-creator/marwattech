"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

type ShareDealProps = {
  title: string;
  url: string;
  image_url?: string | null;
  store?: string;
  discount_label?: string | null;
  code?: string | null;
};

type Platform = {
  id: string;
  label: string;
  icon: string;
  className: string;
  share: (text: string, url: string, title: string) => string | null;
};

/** Build an attractive share message for a course deal — includes our website. */
function buildMessage(title: string, discount_label?: string | null, code?: string | null): string {
  const tag = discount_label || "100% OFF";
  const domain = SITE.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const coupon = code ? `🎟️ Coupon: ${code}\n` : "";
  return `🔥 FREE COURSE on ${SITE.name}! 🚀
📚 ${title}
💰 ${tag} on Udemy
${coupon}🌐 ${domain} — new free courses every day

Grab it before the coupon expires 👇`;
}

const PLATFORMS: Platform[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "whatsapp",
    className:
      "bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 border border-[#25D366]/30",
    share: (text, url) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: "facebook",
    className:
      "bg-[#1877F2]/15 text-[#1877F2] hover:bg-[#1877F2]/25 border border-[#1877F2]/30",
    share: (_text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "x",
    label: "X / Twitter",
    icon: "twitter",
    className:
      "bg-foreground/10 text-foreground hover:bg-foreground/20 border border-foreground/20",
    share: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "linkedin",
    className:
      "bg-[#0A66C2]/15 text-[#0A66C2] hover:bg-[#0A66C2]/25 border border-[#0A66C2]/30",
    share: (_text, url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "share",
    className:
      "bg-[#26A5E4]/15 text-[#26A5E4] hover:bg-[#26A5E4]/25 border border-[#26A5E4]/30",
    share: (text, url) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "email",
    label: "Email",
    icon: "mail",
    className:
      "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25",
    share: (text, url, title) =>
      `mailto:?subject=${encodeURIComponent(`${title} — FREE!`)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

export function ShareDeal({ title, url, image_url, store, discount_label, code }: ShareDealProps) {
  const [message, setMessage] = useState(() => buildMessage(title, discount_label, code));
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render the native-share button after mount to avoid a server/client
  // hydration mismatch (navigator.share only exists on the client).
  useEffect(() => setMounted(true), []);
  const canNativeShare = mounted && "share" in navigator;

  // Keep the coupon code in the shared link so the recipient gets the deal
  // (clicking it opens Udemy with the coupon already applied).
  const shareUrl = url;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Link copied!", { description: "Paste it anywhere to share this deal." });
    } catch {
      toast("Couldn't copy", { description: "Please copy the link manually." });
    }
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Coupon code copied");
    } catch {
      toast.error("Could not copy — copy the code manually.");
    }
  };

  const nativeShare = async () => {
    if ("share" in navigator) {
      try {
        await navigator.share({ title, text: message, url: shareUrl });
      } catch {
        // user cancelled — ignore
      }
    } else {
      toast("Native share not supported", {
        description: "Use WhatsApp, Facebook or copy the link instead.",
      });
    }
  };

  const openPlatform = (p: Platform) => {
    const href = p.share(message, shareUrl, title);
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-full px-3"
          aria-label={`Share ${title}`}
        >
          <AppIcon name="share" size={14} />
          <span className="text-xs font-semibold">Share</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AppIcon name="share" size={18} className="text-primary" />
            Share this deal
          </DialogTitle>
        </DialogHeader>

        {/* Course preview */}
        <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
          {image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image_url}
              alt={title}
              className="h-16 w-16 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon name="dollar" size={22} />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {store && <Badge variant="gold">{store}</Badge>}
              {discount_label && <Badge variant="destructive">{discount_label}</Badge>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{title}</p>
          </div>
        </div>

        {/* Coupon code — always shared so the recipient can claim it */}
        {code ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Coupon code
              </p>
              <code className="font-mono text-sm font-bold tracking-wide text-primary">
                {code}
              </code>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyCode}
              className="shrink-0 gap-1.5"
            >
              <AppIcon name="copy" size={13} />
              Copy
            </Button>
          </div>
        ) : null}

        {/* Editable message */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Share message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        {/* Platform buttons */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openPlatform(p)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold transition-colors",
                p.className
              )}
            >
              <AppIcon name={p.icon as never} size={22} />
              {p.label}
            </button>
          ))}
        </div>

        {/* Copy + native share */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={copyLink}>
            <AppIcon name="copy" size={15} className="mr-1.5" />
            Copy link
          </Button>
          {canNativeShare ? (
            <Button type="button" className="flex-1" onClick={nativeShare}>
              <AppIcon name="share" size={15} className="mr-1.5" />
              More options
            </Button>
          ) : null}
        </div>

        <DialogClose asChild>
          <Button type="button" variant="ghost" size="sm" className="w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
