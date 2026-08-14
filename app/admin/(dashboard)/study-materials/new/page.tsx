import { AdminPageHeader } from "@/components/admin/page-header";
import { StudyMaterialForm } from "@/components/admin/forms/study-material-form";
import { guardEditor } from "@/lib/auth";

export default async function NewStudyMaterialPage() {
  await guardEditor();

  return (
    <>
      <AdminPageHeader
        title="New Study Material"
        description="Add a downloadable resource to the public Study Materials page."
      />
      <StudyMaterialForm isEdit={false} />
    </>
  );
}
