"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteButton } from "@/components/admin/delete-button";
import { CODE_SCRIPT_CATEGORIES, codeScriptUrl } from "@/lib/code-scripts";
import {
  getCodeScripts,
  updateCodeScript,
  setCodeScriptStatus,
  deleteCodeScript,
  requestCodeScriptSync,
} from "@/lib/actions/admin/code-scripts";
import { formatDateTime } from "@/lib/utils";

export type CodeScriptAdminRow = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  version: string | null;
  status: string;
  cover_image: string | null;
  source_url: string;
  updated_at: string;
};

export type CodeScriptSyncRun = {
  id: string;
  ran_at: string;
  sitemap_urls: number;
  new_found: number;
  imported: number;
  failed: number;
  error: string | null;
};

export type CodeScriptSyncRequest = {
  id: string;
  status: string;
  created_at: string;
  processed_at: string | null;
};

const STATUS_STYLE: Record<string, "default" | "secondary" | "outline"> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
};

function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {CODE_SCRIPT_CATEGORIES.map((c) => (
          <SelectItem key={c.slug} value={c.slug}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EditDialog({
  row,
  onClose,
}: {
  row: CodeScriptAdminRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    title: row.title,
    category: row.category ?? "",
    version: row.version ?? "",
    cover_image: row.cover_image ?? "",
    download_url: row.source_url,
    download_links: [] as string[],
    content: "",
    excerpt: "",
    seo_title: "",
    seo_description: "",
  });
  const [pending, setPending] = React.useState(false);

  // Load full details when the dialog opens (the list row is a light projection).
  React.useEffect(() => {
    (async () => {
      const { getCodeScriptDetails } = await import("@/lib/actions/admin/code-scripts");
      const full = await getCodeScriptDetails(row.id);
      if (full) {
        setForm({
          title: full.title ?? row.title,
          category: full.category ?? "",
          version: full.version ?? "",
          cover_image: full.cover_image ?? "",
          download_url: full.download_url ?? full.source_url ?? "",
          download_links: Array.isArray(full.download_links)
            ? (full.download_links as unknown as string[])
            : [],
          content: full.content ?? "",
          excerpt: full.excerpt ?? "",
          seo_title: full.seo_title ?? "",
          seo_description: full.seo_description ?? "",
        });
      }
    })();
  }, [row.id, row.title]);

  const save = async () => {
    setPending(true);
    const res = await updateCodeScript(row.id, {
      title: form.title,
      category: form.category || null,
      version: form.version || null,
      cover_image: form.cover_image || null,
      download_url: form.download_url || null,
      download_links: form.download_links.map((l) => l.trim()).filter(Boolean),
      content: form.content || null,
      excerpt: form.excerpt || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    });
    setPending(false);
    if (!res.ok) return toast.error(res.error || "Could not save");
    toast.success("Saved");
    router.refresh();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit script</DialogTitle>
          <DialogDescription>
            <a className="text-primary underline" href={row.source_url} target="_blank" rel="noreferrer">
              {row.source_url}
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Version</Label>
              <Input value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} placeholder="2.0" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <CategorySelect value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Download URL</Label>
              <Input value={form.download_url} onChange={(e) => setForm((f) => ({ ...f, download_url: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Download links (one per line)</Label>
              <Textarea
                rows={4}
                value={form.download_links.join("\n")}
                onChange={(e) => setForm((f) => ({ ...f, download_links: e.target.value.split("\n") }))}
                placeholder={"https://mirror-1.example/file\nhttps://mirror-2.example/file"}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Cover image URL</Label>
              <Input value={form.cover_image} onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>SEO title</Label>
            <Input value={form.seo_title} onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>SEO description</Label>
            <Textarea rows={2} value={form.seo_description} onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Content (HTML)</Label>
            <Textarea rows={10} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScriptsTab({ rows }: { rows: CodeScriptAdminRow[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [edit, setEdit] = React.useState<CodeScriptAdminRow | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  const filtered = rows.filter((r) => {
    if (cat !== "all" && r.category !== cat) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.title.toLowerCase().includes(q) || r.slug.includes(q);
  });

  const toggleStatus = async (r: CodeScriptAdminRow) => {
    setPending(r.id);
    const next = r.status === "published" ? "draft" : "published";
    const res = await setCodeScriptStatus(r.id, next as "published" | "draft");
    setPending(null);
    if (!res.ok) return toast.error(res.error || "Could not update");
    toast.success(next === "published" ? "Published" : "Unpublished");
    router.refresh();
  };

  const onDelete = async (id: string) => {
    const res = await deleteCodeScript(id);
    if (!res.ok) toast.error(res.error || "Could not delete");
    else {
      toast.success("Deleted");
      router.refresh();
    }
    return res;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-xs">
            <AppIcon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or slug…" className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="sm:w-[190px]">
              <SelectValue>{cat === "all" ? "All categories" : CODE_SCRIPT_CATEGORIES.find((c) => c.slug === cat)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CODE_SCRIPT_CATEGORIES.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={async () => {
          const res = await requestCodeScriptSync();
          if (!res.ok) return toast.error(res.error || "Could not request sync");
          toast.success("Sync queued — the VPS picks it up within ~15 min. Check the Sync tab.");
          router.refresh();
        }}>
          <AppIcon name="refresh" size={16} className="mr-1.5" />
          Sync now
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated (UTC)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-14 text-center text-muted-foreground">No scripts yet — hit “Sync now” to pull from the source site.</TableCell></TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover_image} alt={r.title} className="size-11 rounded-lg object-cover" />
                    ) : (
                      <span className="grid size-11 place-items-center rounded-lg bg-primary/10 font-bold text-primary">{r.title.slice(0, 1).toUpperCase()}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0 max-w-[260px]">
                      <a href={codeScriptUrl(r.slug)} target="_blank" rel="noreferrer" className="line-clamp-2 font-medium hover:underline">{r.title}</a>
                      <p className="truncate text-xs text-muted-foreground">{r.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell><span className="capitalize">{r.category?.replace("-", " ") ?? "—"}</span></TableCell>
                  <TableCell>{r.version ? <Badge variant="outline">v{r.version}</Badge> : "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_STYLE[r.status] ?? "outline"} className="capitalize">{r.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(r.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => setEdit(r)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(r)} disabled={pending === r.id}>
                        {r.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <DeleteButton itemId={r.id} onDelete={(id) => onDelete(id)} label="script" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {edit && <EditDialog row={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function SyncTab({
  runs,
  requests,
}: {
  runs: CodeScriptSyncRun[];
  requests: CodeScriptSyncRequest[];
}) {
  const pendingReq = requests.find((r) => r.status === "pending");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <AppIcon name={pendingReq ? "refresh" : "check"} size={18} className={pendingReq ? "animate-spin text-blue-500" : "text-emerald-500"} />
        <div>
          <p className="text-sm font-semibold">
            {pendingReq ? "A sync is queued — the VPS runner will pick it up within ~15 min." : "No sync currently queued."}
          </p>
          <p className="text-xs text-muted-foreground">
            Automatic sync runs every 48h. Manual runs appear here once processed.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ran at (UTC)</TableHead>
              <TableHead>Sitemap URLs</TableHead>
              <TableHead>New found</TableHead>
              <TableHead>Imported</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No sync runs yet.</TableCell></TableRow>
            ) : (
              runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.ran_at)}</TableCell>
                  <TableCell>{r.sitemap_urls}</TableCell>
                  <TableCell>{r.new_found}</TableCell>
                  <TableCell><Badge variant="default">{r.imported}</Badge></TableCell>
                  <TableCell>{r.failed > 0 ? <Badge variant="destructive">{r.failed}</Badge> : "0"}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs text-destructive" title={r.error ?? undefined}>{r.error ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function CodeScriptsAdmin({
  rows,
  runs,
  requests,
}: {
  rows: CodeScriptAdminRow[];
  runs: CodeScriptSyncRun[];
  requests: CodeScriptSyncRequest[];
}) {
  return (
    <Tabs defaultValue="scripts">
      <TabsList>
        <TabsTrigger value="scripts">Scripts ({rows.length})</TabsTrigger>
        <TabsTrigger value="sync">Sync history</TabsTrigger>
      </TabsList>
      <TabsContent value="scripts"><ScriptsTab rows={rows} /></TabsContent>
      <TabsContent value="sync"><SyncTab runs={runs} requests={requests} /></TabsContent>
    </Tabs>
  );
}
