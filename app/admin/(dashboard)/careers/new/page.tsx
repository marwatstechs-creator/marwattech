import { AdminPageHeader } from "@/components/admin/page-header";
import { CareerForm } from "@/components/admin/forms/career-form";

export default function NewCareerPage() {
  return (
    <>
      <AdminPageHeader title="New Position" description="Add an open position." />
      <CareerForm isEdit={false} />
    </>
  );
}
