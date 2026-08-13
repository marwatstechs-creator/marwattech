"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";

/**
 * Avatar → account menu (like social platforms): My Profile / Settings / Sign Out.
 * Used in the admin + client dashboard topbars.
 */
export function AvatarMenu({
  user,
  profileHref,
  settingsHref,
  signOutHref = "/",
  onSignedOut,
}: {
  user: { email?: string; full_name: string | null; avatar_url?: string | null };
  profileHref: string;
  settingsHref?: string;
  signOutHref?: string;
  onSignedOut?: () => void;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const db = createClient();
      await db.auth.signOut();
      onSignedOut?.();
      toast.success("Signed out");
      router.push(signOutHref);
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="nav-item-3d grid size-9 shrink-0 place-items-center rounded-full outline-none"
          aria-label="Account menu"
        >
          <Avatar className="size-9">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.full_name ?? "User"} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {initials(user.full_name ?? "U")}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3 py-1">
            <Avatar className="size-10">
              {user.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.full_name ?? "User"} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                {initials(user.full_name ?? "U")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.full_name ?? "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(profileHref)}>
          <AppIcon name="userAdd" size={16} className="mr-2" />
          My Profile
        </DropdownMenuItem>
        {settingsHref && (
          <DropdownMenuItem onClick={() => router.push(settingsHref)}>
            <AppIcon name="settings" size={16} className="mr-2" />
            Settings
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
          <AppIcon name="logout" size={16} className="mr-2" />
          {signingOut ? "Signing out…" : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
