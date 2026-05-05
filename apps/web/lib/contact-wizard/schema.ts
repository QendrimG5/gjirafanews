import { z } from "zod";

export const personalInfoSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number"),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

export const preferencesSchema = z.discriminatedUnion("userType", [
  z.object({
    userType: z.literal("individual"),
    newsletter: z.boolean().default(false),
  }),
  z.object({
    userType: z.literal("business"),
    companyName: z.string().trim().min(2, "Company name is required"),
    vatNumber: z
      .string()
      .trim()
      .regex(/^[A-Z]{2}[0-9A-Z]{2,12}$/, "Enter a valid VAT number"),
  }),
  z.object({
    userType: z.literal("student"),
    university: z.string().trim().min(2, "University is required"),
    graduationYear: z
      .string()
      .regex(/^\d{4}$/, "Enter a 4-digit year")
      .refine((y) => {
        const n = Number(y);
        return n >= 1950 && n <= new Date().getFullYear() + 10;
      }, "Year is out of range"),
  }),
]);

export type PreferencesInput = z.infer<typeof preferencesSchema>;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const documentFileSchema = z
  .instanceof(File, { message: "Invalid file" })
  .refine((f) => f.size > 0, "File is empty")
  .refine((f) => f.size <= MAX_FILE_BYTES, "File must be ≤ 5 MB")
  .refine(
    (f) => (ALLOWED_MIME as readonly string[]).includes(f.type),
    "Allowed: PNG, JPEG, WEBP, PDF",
  );

export const documentsSchema = z
  .array(documentFileSchema)
  .min(1, "Upload at least one document")
  .max(5, "Maximum 5 documents");

export const contactSubmissionSchema = z.object({
  personal: personalInfoSchema,
  preferences: preferencesSchema,
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

export const FILE_LIMITS = {
  maxBytes: MAX_FILE_BYTES,
  allowedMime: ALLOWED_MIME,
};
