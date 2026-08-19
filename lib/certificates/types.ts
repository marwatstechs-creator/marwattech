/**
 * Course Completion Certificate — data types.
 *
 * Mirrors the JSON schema in `lib/certificates/schema.ts` and the
 * `certificates` table in the database.
 */

export type CertificateStatus = "locked" | "eligible" | "issued" | "revoked";

export type CertificateSignature = {
  name: string;
  title: string;
  image: string | null;
};

export type CertificateJson = {
  certificate: {
    id: string;
    verification_code: string;
    status: CertificateStatus;
    issue_date: string;
    completion_date: string;
  };
  student: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    category?: string;
    instructor?: string;
    duration?: string;
  };
  platform: {
    name: string;
    website: string;
    logo: string;
  };
  signatures: {
    director: CertificateSignature;
    instructor: CertificateSignature;
  };
};

/** Row shape returned from the `certificates` table. */
export type CertificateRow = {
  id: string;
  certificate_no: string;
  verification_code: string;
  student_id: string;
  course_id: string;
  student_name: string;
  course_title: string;
  course_category: string | null;
  instructor_name: string | null;
  course_duration: string | null;
  status: CertificateStatus | string;
  issue_date: string | null;
  completion_date: string | null;
  metadata: CertificateJson | null;
  created_at: string;
  updated_at: string;
};
