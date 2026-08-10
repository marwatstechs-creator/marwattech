import { AdminPageHeader } from "@/components/admin/page-header";
import { TestimonialForm } from "@/components/admin/forms/testimonial-form";

export default function NewTestimonialPage() {
  return (
    <>
      <AdminPageHeader title="New Testimonial" description="Add client feedback." />
      <TestimonialForm isEdit={false} />
    </>
  );
}
