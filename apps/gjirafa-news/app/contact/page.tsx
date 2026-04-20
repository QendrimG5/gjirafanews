import type { Metadata } from "next";
import { ContactWizard } from "@/components/contact-wizard";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the GjirafaNews team.",
};

export default function ContactPage() {
  return <ContactWizard />;
}
