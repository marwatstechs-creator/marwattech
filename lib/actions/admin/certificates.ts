"use server";

import { requireEditor, logActivity, revalidateContent } from "./helpers";

export type CertificateAdminResult = { ok: boolean; error?: string };

/** Change a certificate's status (e.g. issued ↔ revoked). */
export async function setCertificateStatus(
  id: string,
  status: string
): Promise<CertificateAdminResult> {
  const { session, db } = await requireEditor();
  const { data: cert } = await db.from("certificates").select("id").eq("id", id).single();
  if (!cert) return { ok: false, error: "Certificate not found." };

  const { error } = await db.from("certificates").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity(db, session, "update", "certificate", id, { to: status });
  await revalidateContent([`/certificate/${id}`]);
  return { ok: true };
}

export async function revokeCertificate(id: string) {
  return setCertificateStatus(id, "revoked");
}

export async function reissueCertificate(id: string) {
  return setCertificateStatus(id, "issued");
}

/** Reissue / regenerate: re-stamp an issued certificate as current. */
export async function regenerateCertificate(id: string) {
  return setCertificateStatus(id, "issued");
}

export async function deleteCertificate(id: string): Promise<CertificateAdminResult> {
  const { session, db } = await requireEditor();
  const { error } = await db.from("certificates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity(db, session, "delete", "certificate", id, {});
  await revalidateContent([`/certificate/${id}`]);
  return { ok: true };
}
