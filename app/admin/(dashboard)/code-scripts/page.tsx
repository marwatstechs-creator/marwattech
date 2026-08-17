import { AdminPageHeader } from "@/components/admin/page-header";
import {
  CodeScriptsAdmin,
  type CodeScriptAdminRow,
  type CodeScriptSyncRun,
  type CodeScriptSyncRequest,
} from "@/components/admin/code-scripts-admin";
import { getCodeScripts, getCodeScriptSyncs } from "@/lib/actions/admin/code-scripts";

export const revalidate = 0;

export default async function AdminCodeScriptsPage() {
  let rows: CodeScriptAdminRow[] = [];
  let runs: CodeScriptSyncRun[] = [];
  let requests: CodeScriptSyncRequest[] = [];

  try {
    const [list, sync] = await Promise.all([getCodeScripts(), getCodeScriptSyncs()]);
    rows = (list.rows ?? []) as CodeScriptAdminRow[];
    runs = (sync.runs ?? []) as CodeScriptSyncRun[];
    requests = (sync.requests ?? []) as CodeScriptSyncRequest[];
  } catch {
    // fallback — empty
  }

  return (
    <>
      <AdminPageHeader
        title="Code Scripts"
        description="Manage scripts synced from your source site — edit, publish and trigger a sync."
      />
      <CodeScriptsAdmin rows={rows} runs={runs} requests={requests} />
    </>
  );
}
