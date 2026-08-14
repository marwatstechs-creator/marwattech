import { AdminPageHeader } from "@/components/admin/page-header";
import { PromoCodeForm } from "@/components/admin/forms/promo-code-form";
import { guardEditor } from "@/lib/auth";

export default async function NewPromoCodePage() {
  await guardEditor();

  return (
    <>
      <AdminPageHeader
        title="New Promo Code"
        description="Add a promo code to the public Promo Codes page."
      />
      <PromoCodeForm isEdit={false} />
    </>
  );
}
