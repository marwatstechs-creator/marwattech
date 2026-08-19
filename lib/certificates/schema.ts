/**
 * Reusable JSON Schema for the LMS Course Completion Certificate.
 * Conforms to JSON Schema draft 2020-12.
 */
export const CERTIFICATE_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "LMS Course Completion Certificate",
  type: "object",
  required: ["certificate", "student", "course", "platform", "signatures"],
  properties: {
    certificate: {
      type: "object",
      required: ["id", "verification_code", "status", "issue_date", "completion_date"],
      properties: {
        id: { type: "string" },
        verification_code: { type: "string" },
        status: { type: "string", enum: ["locked", "eligible", "issued", "revoked"] },
        issue_date: { type: "string", format: "date" },
        completion_date: { type: "string", format: "date" },
      },
    },
    student: {
      type: "object",
      required: ["id", "name", "email"],
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
    course: {
      type: "object",
      required: ["id", "title"],
      properties: {
        id: { type: "integer" },
        title: { type: "string" },
        category: { type: "string" },
        instructor: { type: "string" },
        duration: { type: "string" },
      },
    },
    platform: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        website: { type: "string" },
        logo: { type: "string" },
      },
    },
    signatures: {
      type: "object",
      properties: {
        director: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            image: { type: ["string", "null"] },
          },
        },
        instructor: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            image: { type: ["string", "null"] },
          },
        },
      },
    },
  },
} as const;

export default CERTIFICATE_JSON_SCHEMA;
