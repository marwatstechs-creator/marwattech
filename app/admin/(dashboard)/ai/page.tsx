import { AdminPageHeader } from "@/components/admin/page-header";
import { AiChat, type AiHistoryItem, type AiContextData } from "@/components/admin/ai-chat";
import { getAiHistory, getAiContext } from "@/lib/actions/admin/ai";
import { guardEditor } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminAiPage() {
  await guardEditor();

  let history: AiHistoryItem[] = [];
  let context: AiContextData = {
    counts: {},
    recent: [],
    syncs: [],
    generatedAt: "",
  };
  try {
    const [h, c] = await Promise.all([getAiHistory(), getAiContext()]);
    history = h as AiHistoryItem[];
    context = c as AiContextData;
  } catch {
    // Supabase not configured — empty state is fine
  }

  return (
    <>
      <AdminPageHeader
        title="AI Assistant"
        description="Real AI admin assistant powered by DeepSeek — chat, generate blog drafts, and see what has been done on the site."
      />
      <AiChat history={history} context={context} />
    </>
  );
}
