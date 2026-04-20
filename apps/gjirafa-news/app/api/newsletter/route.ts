import { NextRequest } from "next/server";
import { Resend } from "resend";
import { articles, getArticleWithRelations } from "@/lib/data";
import { renderWelcomeEmail } from "@/lib/email-templates/welcome";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return Response.json(
        { error: "Adresa e email-it nuk është e vlefshme." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
    const notifyTo = process.env.RESEND_NOTIFY_TO;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      request.headers.get("origin") ??
      "http://localhost:3000";

    if (!apiKey) {
      return Response.json(
        { error: "Shërbimi i newsletter-it nuk është konfiguruar." },
        { status: 503 },
      );
    }

    const firstArticle = [...articles]
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime(),
      )
      .map(getArticleWithRelations)[0];

    const { subject, html } = renderWelcomeEmail({ firstArticle, siteUrl });

    const resend = new Resend(apiKey);

    const welcome = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

    if (welcome.error) {
      return Response.json(
        { error: welcome.error.message ?? "Regjistrimi dështoi." },
        { status: 502 },
      );
    }

    if (notifyTo) {
      await resend.emails.send({
        from,
        to: notifyTo,
        subject: "Regjistrim i ri në newsletter",
        html: `<p>Një përdorues i ri u regjistrua: <strong>${email}</strong></p>`,
      });
    }

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Gabim i brendshëm. Provo përsëri." },
      { status: 500 },
    );
  }
}
