"use server";

import { z } from "zod";
import {
  personalInfoSchema,
  preferencesSchema,
  documentFileSchema,
} from "@/lib/contact-wizard/schema";

export type SubmitState = { ok: boolean; message: string };

export async function submitContactForm(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  try {
    const personal = personalInfoSchema.parse(
      JSON.parse(String(formData.get("personal") ?? "{}")),
    );
    const preferences = preferencesSchema.parse(
      JSON.parse(String(formData.get("preferences") ?? "{}")),
    );
    const files = formData
      .getAll("documents")
      .filter((v): v is File => v instanceof File);
    const documents = z
      .array(documentFileSchema)
      .min(1, "Upload at least one document")
      .max(5, "Maximum 5 documents")
      .parse(files);

    console.log("[contact] submission", {
      personal,
      preferences,
      docCount: documents.length,
    });

    return { ok: true, message: "We'll reply within 2 business days." };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        message: err.issues[0]?.message ?? "Validation failed",
      };
    }
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
