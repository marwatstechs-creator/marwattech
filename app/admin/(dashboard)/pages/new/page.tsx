import { AdminPageHeader } from "@/components/admin/page-header";
import { PageForm } from "@/components/admin/forms/page-form";
import { guardEditor } from "@/lib/auth";

export default async function AdminNewPage() {
  await guardEditor();
  return (
    <>
      <AdminPageHeader title="New Page" description="Create a new static page for your website." />
      <PageForm isEdit={false} />
    </>
  );
}
