"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { getGitHubLoginUrl } from "@/lib/actions/github";
import { trackEvent } from "@/lib/analytics";

const GITHUB_MARK = (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
    />
  </svg>
);

/**
 * "Continue with GitHub" — direct OAuth redirect flow using a GitHub App.
 * Uses the Client ID + Secret saved in Admin → Settings → GitHub Sign-In.
 */
export function GitHubSignIn({ mode = "admin" }: { mode?: "admin" | "client" }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGitHub = async () => {
    setPending(true);
    setError(null);
    const res = await getGitHubLoginUrl(mode);
    if (!res.ok) {
      setPending(false);
      setError(
        "GitHub sign-in isn't enabled yet. Add your GitHub App Client ID & Secret in Admin → Settings → GitHub Sign-In first."
      );
      return;
    }
    trackEvent("github_signin");
    window.location.href = res.url;
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full bg-[#111827] text-white shadow-sm hover:bg-[#1f2937] dark:bg-[#111827] dark:text-white dark:shadow-md dark:hover:bg-[#1f2937]"
        onClick={handleGitHub}
        disabled={pending}
      >
        {GITHUB_MARK}
        {pending ? "Redirecting to GitHub…" : "Continue with GitHub"}
      </Button>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
