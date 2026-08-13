"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateUserRole,
  updateUserDetails,
  resetUserPassword,
  sendPasswordResetLink,
  resendConfirmationEmail,
  setUserSuspended,
  createAdminUser,
  deleteAdminUser,
  getUserActivity,
} from "@/lib/actions/admin/users";
import { formatDate, initials } from "@/lib/utils";

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
  providers: string[];
};

const ROLES = ["super_admin", "editor", "support", "client"] as const;
const STAFF = ["super_admin", "editor", "support"];

type ActivityItem = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  );
}

export function UsersTable({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  // Toolbar
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "staff" | "clients">("all");

  // Add-user dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ fullName: "", email: "", password: "", role: "editor" as (typeof ROLES)[number] });

  // Edit-details dialog
  const [editUser, setEditUser] = React.useState<AdminUserRow | null>(null);
  const [editForm, setEditForm] = React.useState({ full_name: "", phone: "", avatar_url: "" });

  // Reset-password dialog
  const [resetUser, setResetUser] = React.useState<AdminUserRow | null>(null);
  const [resetPassword, setResetPassword] = React.useState("");

  // Details + activity dialog
  const [detailUser, setDetailUser] = React.useState<AdminUserRow | null>(null);
  const [activity, setActivity] = React.useState<ActivityItem[] | null>(null);

  // Delete dialog
  const [deleteUser, setDeleteUser] = React.useState<AdminUserRow | null>(null);

  React.useEffect(() => {
    if (!detailUser) {
      setActivity(null);
      return;
    }
    setActivity(null);
    getUserActivity(detailUser.id)
      .then((rows) => setActivity(rows as ActivityItem[]))
      .catch(() => setActivity([]));
  }, [detailUser]);

  const isSuspended = (u: AdminUserRow) =>
    !!u.banned_until && new Date(u.banned_until).getTime() > Date.now();
  const isCurrent = (id: string) => id === currentUserId;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === "staff" && !STAFF.includes(u.role)) return false;
      if (roleFilter === "clients" && u.role !== "client") return false;
      if (!q) return true;
      return (
        (u.full_name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const run = async (
    key: string,
    fn: () => Promise<{ error?: string } | { ok: boolean }>,
    successMsg = "Done"
  ) => {
    setPending(key);
    const res = await fn();
    setPending(null);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success(successMsg);
    router.refresh();
  };

  const changeRole = (id: string, role: string) =>
    run(`role-${id}`, () => updateUserRole(id, role as (typeof ROLES)[number]), "Role updated");

  const saveDetails = () => {
    if (!editUser) return;
    run("edit", () =>
      updateUserDetails(editUser.id, {
        full_name: editForm.full_name,
        phone: editForm.phone,
        avatar_url: editForm.avatar_url,
      })
    ).then(() => setEditUser(null));
  };

  const doResetPassword = () => {
    if (!resetUser) return;
    run("reset", () => resetUserPassword(resetUser.id, resetPassword), "Password updated").then(() => {
      setResetPassword("");
      setResetUser(null);
    });
  };

  const sendReset = (u: AdminUserRow) =>
    run(`resetlink-${u.id}`, () => sendPasswordResetLink(u.id), "Reset link sent by email");

  const resendConfirm = (u: AdminUserRow) =>
    run(`confirm-${u.id}`, () => resendConfirmationEmail(u.id), "Confirmation link sent by email");

  const toggleSuspend = (u: AdminUserRow) =>
    run(
      `suspend-${u.id}`,
      () => setUserSuspended(u.id, !isSuspended(u)),
      isSuspended(u) ? "User activated" : "User suspended"
    );

  const addUser = async () => {
    if (!form.email || form.password.length < 8) {
      return toast.error("Email required and password must be at least 8 characters.");
    }
    setPending("new");
    const res = await createAdminUser(form.email, form.password, form.role, form.fullName);
    setPending(null);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("User created");
    setAddOpen(false);
    setForm({ fullName: "", email: "", password: "", role: "editor" });
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setPending(`delete-${deleteUser.id}`);
    const res = await deleteAdminUser(deleteUser.id);
    setPending(null);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("User deleted");
    setDeleteUser(null);
    router.refresh();
  };

  const statusBadge = (u: AdminUserRow) => {
    if (isSuspended(u))
      return <Badge variant="outline" className="border-destructive/40 text-destructive">Suspended</Badge>;
    if (!u.confirmed_at)
      return <Badge variant="outline" className="border-amber-400/50 text-amber-600 dark:text-amber-400">Unconfirmed</Badge>;
    return <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">Active</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-xs">
            <AppIcon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground">{filtered.length} shown</Badge>
          <Button onClick={() => setAddOpen(true)}>
            <AppIcon name="userAdd" size={16} />
            Add User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {u.avatar_url ? <AvatarImage src={u.avatar_url} alt={u.full_name ?? "User"} /> : null}
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {initials(u.full_name ?? u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium">
                          <span className="truncate">{u.full_name ?? "Unnamed"}</span>
                          {isCurrent(u.id) && (
                            <Badge variant="outline" className="text-[10px]">you</Badge>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.phone || "—"}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => changeRole(u.id, v)}
                      disabled={pending === `role-${u.id}` || isCurrent(u.id)}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            <span className="capitalize">{r.replace("_", " ")}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{statusBadge(u)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="User actions">
                          <AppIcon name="settings" size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuLabel>{u.full_name ?? "User"}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDetailUser(u)}>
                          <AppIcon name="eye" size={15} className="mr-2" /> View details &amp; activity
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditUser(u);
                            setEditForm({
                              full_name: u.full_name ?? "",
                              phone: u.phone ?? "",
                              avatar_url: u.avatar_url ?? "",
                            });
                          }}
                        >
                          <AppIcon name="edit" size={15} className="mr-2" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isCurrent(u.id)}
                          onClick={() => {
                            setResetUser(u);
                            setResetPassword("");
                          }}
                        >
                          <AppIcon name="lock" size={15} className="mr-2" /> Reset password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={pending === `resetlink-${u.id}`}
                          onClick={() => sendReset(u)}
                        >
                          <AppIcon name="mail" size={15} className="mr-2" /> Send reset link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!!u.confirmed_at || pending === `confirm-${u.id}`}
                          onClick={() => resendConfirm(u)}
                        >
                          <AppIcon name="refresh" size={15} className="mr-2" /> Resend confirmation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isCurrent(u.id) || pending === `suspend-${u.id}`}
                          onClick={() => toggleSuspend(u)}
                        >
                          <AppIcon name={isSuspended(u) ? "check" : "shield"} size={15} className="mr-2" />
                          {isSuspended(u) ? "Activate account" : "Suspend account"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isCurrent(u.id)}
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteUser(u)}
                        >
                          <AppIcon name="delete" size={15} className="mr-2" /> Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Add user dialog ─────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a team member</DialogTitle>
            <DialogDescription>
              They’ll receive an email invite to sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as (typeof ROLES)[number] }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addUser} disabled={pending === "new"}>
              {pending === "new" ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit details dialog ─────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user details</DialogTitle>
            <DialogDescription>
              Update name, phone and avatar for {editUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+92 300 0000000" />
            </div>
            <div className="space-y-2">
              <Label>Avatar URL</Label>
              <Input value={editForm.avatar_url} onChange={(e) => setEditForm((f) => ({ ...f, avatar_url: e.target.value }))} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={saveDetails} disabled={pending === "edit"}>
              {pending === "edit" ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset password dialog ───────────────────────── */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>Cancel</Button>
            <Button onClick={doResetPassword} disabled={pending === "reset"}>
              {pending === "reset" ? "Saving…" : "Set password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Details + activity dialog ───────────────────── */}
      <Dialog open={!!detailUser} onOpenChange={(o) => !o && setDetailUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailUser?.full_name ?? "User"}</DialogTitle>
            <DialogDescription>{detailUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Role" value={detailUser?.role ?? ""} />
            <Detail label="Phone" value={detailUser?.phone || "—"} />
            <Detail label="Joined" value={detailUser ? formatDate(detailUser.created_at) : ""} />
            <Detail label="Last sign-in" value={detailUser?.last_sign_in_at ? formatDate(detailUser.last_sign_in_at) : "—"} />
            <Detail label="Email confirmed" value={detailUser?.confirmed_at ? "Yes" : "No"} />
            <Detail label="Sign-in method" value={detailUser?.providers?.join(", ") || "—"} />
            <Detail label="Status" value={detailUser ? (isSuspended(detailUser) ? "Suspended" : "Active") : ""} />
          </div>
          <Separator />
          <div>
            <p className="mb-2 text-sm font-semibold">Recent activity</p>
            {activity === null ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : activity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity recorded.</p>
            ) : (
              <ul className="max-h-56 space-y-1.5 overflow-y-auto text-xs">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2">
                    <span className="capitalize text-foreground/80">{a.action.replace(/_/g, " ")}</span>
                    <span className="shrink-0 text-muted-foreground">{formatDate(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ───────────────────────────────── */}
      <Dialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This permanently deletes {deleteUser?.email} and all of their data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending === `delete-${deleteUser?.id}`}>
              {pending === `delete-${deleteUser?.id}` ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
