import { AdminPageHeader } from "@/components/admin/page-header";
import {
  CodeScriptsAdmin,
  type CodeScriptListData,
  type CodeScriptSyncRun,
  type CodeScriptSyncRequest,
} from "@/components/admin/code-scripts-admin";
import { getCodeScripts, getCodeScriptSyncs } from "@/lib/actions/admin/code-scripts";

export const revalidate = 0;

export default async function AdminCodeScriptsPage() {
  let initial: CodeScriptListData = {
    rows: [],
    total: 0,
    page: 1,
    perPage: 50,
    totalPages: 1,
    categoryCounts: {},
  };
  let runs: CodeScriptSyncRun[] = [];
  let requests: CodeScriptSyncRequest[] = [];

  try {
    const [list, sync] = await Promise.all([
      getCodeScripts({ page: 1, perPage: 50 }),
      getCodeScriptSyncs(),
    ]);
    initial = list as CodeScriptListData;
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
      <CodeScriptsAdmin initial={initial} runs={runs} requests={requests} />
    </>
  );
}
