"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

/**
 * PWA install prompt — shows a branded popup asking users to install the
 * app on their phone (iPhone + Android) or to install it from a desktop
 * browser tab.
 *
 *  - Android / desktop Chrome & Edge: uses the native `beforeinstallprompt`.
 *  - iOS Safari (no native prompt): shows "Add to Home Screen" steps.
 *  - Other desktop browsers (tabs): shows browser-menu instructions.
 *  - Never shows if already installed (standalone) or dismissed.
 */
type Platform = "ios" | "android" | "desktop";

const STORAGE_KEY = "pwa_install_prompt_dismissed";

function getPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS home-screen web apps
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Install prompt is mobile-only (iPhone + Android) — never shown on desktop. */
function isMobilePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const p = getPlatform();
  return p === "ios" || p === "android";
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPlatform(getPlatform());

    // Mobile only — never prompt desktop/tab users.
    if (!isMobilePlatform()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Skip if already installed or the user dismissed before.
    if (isStandalone() || localStorage.getItem(STORAGE_KEY) === "1") {
      return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }

    // Show once: after a short delay AND (some scroll OR enough time), so we
    // don't interrupt users the moment they land on the page.
    let scrolled = false;
    const onScroll = () => {
      if (window.scrollY > 220) {
        scrolled = true;
        maybeShow();
      }
    };
    let timer = 0;
    const maybeShow = () => {
      if (show) return;
      if (scrolled || performance.now() > 13000) {
        setShow(true);
      }
    };
    timer = window.setTimeout(() => maybeShow(), 6000);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (remember = true) => {
    if (remember) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setDismissed(true);
    setShow(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") dismiss();
    } catch {
      /* ignore */
    }
    setDeferredPrompt(null);
  };

  const isIOS = platform === "ios";
  const isMobile = platform === "ios" || platform === "android";
  const canInstall = Boolean(deferredPrompt);

  return (
    <AnimatePresence>
      {show && !dismissed && !isStandalone() && isMobile && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Install Marwat Tech app"
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dismiss()}
        >
          <motion.div
            className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-2xl"
            initial={{ y: 60, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 60, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary via-[#8b7dd4] to-azure p-5 text-white">
              <button
                type="button"
                aria-label="Close"
                onClick={() => dismiss()}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <AppIcon name="close" size={15} />
              </button>
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl bg-white/15 text-gold ring-1 ring-white/25">
                  <AppIcon name="download" size={22} />
                </span>
                <div>
                  <p className="font-display text-lg font-bold leading-tight">
                    Install {SITE.name}
                  </p>
                  <p className="text-xs text-white/80">Get the app on your device</p>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-gold via-[#f9d76b] to-gold" />

            {/* Body */}
            <div className="p-5">
              {isIOS ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Add {SITE.name} to your home screen so it opens like a real app — no App Store
                    needed.
                  </p>
                  <ol className="space-y-2">
                    {[
                      { icon: "share", text: "Tap the Share button in Safari" },
                      { icon: "plus", text: 'Tap "Add to Home Screen"' },
                      { icon: "check", text: 'Tap "Add" — the app icon appears on your home screen' },
                    ].map((s, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <AppIcon name={s.icon as never} size={15} />
                        </span>
                        <span className="text-xs font-medium">{s.text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : canInstall ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Install {SITE.name} on your device for offline access, faster loading and a
                    full-screen app experience.
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                    <AppIcon name="check" size={15} className="text-primary" />
                    100% free · No app store needed · Updates automatically
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You can use {SITE.name} like an app right from your browser. Open your browser
                    menu and choose <strong>“Install app”</strong> or <strong>“Add to Home Screen”</strong>.
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                    <AppIcon name="star" size={15} className="text-gold" />
                    Works on iPhone, Android, desktop — any device
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex gap-2">
                {canInstall ? (
                  <Button className="flex-1" onClick={install}>
                    <AppIcon name="download" size={15} className="mr-1.5" />
                    Install now
                  </Button>
                ) : (
                  <Button variant="gold" className="flex-1" onClick={() => dismiss()}>
                    <AppIcon name="check" size={15} className="mr-1.5" />
                    Got it
                  </Button>
                )}
                <Button variant="outline" onClick={() => dismiss()}>
                  Not now
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
