import type { ArticleWithRelations } from "@gjirafanews/types";

// Project palette (mirrors globals.css — emails need inline hex, no CSS vars)
const C = {
  primary: "#18181b",
  primaryLight: "#27272a",
  accent: "#16a34a",
  accentLight: "#22c55e",
  accentMuted: "#f0fdf4",
  surface: "#ffffff",
  background: "#fafafa",
  border: "#e5e5e5",
  text: "#171717",
  textSecondary: "#525252",
  textTertiary: "#a3a3a3",
  textInverse: "#ffffff",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface WelcomeEmailOptions {
  firstArticle?: ArticleWithRelations;
  siteUrl: string;
}

export function renderWelcomeEmail({
  firstArticle,
  siteUrl,
}: WelcomeEmailOptions): { subject: string; html: string } {
  const articleUrl = firstArticle
    ? `${siteUrl}/article/${firstArticle.id}`
    : siteUrl;

  const subject = firstArticle
    ? `Mirë se erdhe! Lajmi i ditës: ${firstArticle.title}`
    : "Mirë se erdhe në GjirafaNews!";

  const articleBlock = firstArticle
    ? `
      <tr>
        <td style="padding: 0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <td style="padding-bottom: 12px;">
                <p style="margin: 0; font: 600 11px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 1.5px; text-transform: uppercase; color: ${C.textTertiary};">
                  Lajmi i ditës
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <a href="${articleUrl}" style="text-decoration: none; color: inherit; display: block;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 12px; overflow: hidden;">
                    <tr>
                      <td>
                        <img src="${escapeHtml(firstArticle.imageUrl)}" alt="" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 20px 22px;">
                        <span style="display: inline-block; background: ${C.accentMuted}; color: ${C.accent}; font: 600 11px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.5px; padding: 5px 10px; border-radius: 999px; margin-bottom: 12px;">
                          ${escapeHtml(firstArticle.category.name)}
                        </span>
                        <h2 style="margin: 0 0 8px; font: 700 20px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.text};">
                          ${escapeHtml(firstArticle.title)}
                        </h2>
                        <p style="margin: 0 0 14px; font: 400 14px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.textSecondary};">
                          ${escapeHtml(firstArticle.summary)}
                        </p>
                        <p style="margin: 0 0 16px; font: 400 12px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.textTertiary};">
                          ${escapeHtml(firstArticle.source.name)} · ${firstArticle.readTime} min lexim
                        </p>
                        <span style="display: inline-block; background: ${C.accent}; color: ${C.textInverse}; font: 600 13px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 11px 18px; border-radius: 8px; text-decoration: none;">
                          Lexo lajmin →
                        </span>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height: 32px; line-height: 32px;">&nbsp;</td></tr>
    `
    : "";

  const html = `<!doctype html>
<html lang="sq">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${C.background}; color: ${C.text}; -webkit-font-smoothing: antialiased;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      Faleminderit që u regjistrove në GjirafaNews — ja një lajm i zgjedhur për ty.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: ${C.background};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; background: ${C.surface}; border-radius: 16px; overflow: hidden;">

            <!-- Logo header -->
            <tr>
              <td style="padding: 24px 32px; border-bottom: 1px solid ${C.border};">
                <a href="${siteUrl}" style="text-decoration: none;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="vertical-align: middle; padding-right: 10px;">
                        <div style="width: 34px; height: 34px; background: ${C.primary}; border-radius: 8px; text-align: center; line-height: 34px; font: 700 15px/34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.textInverse};">
                          G
                        </div>
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="font: 600 18px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.text}; letter-spacing: -0.2px;">
                          Gjirafa<span style="color: ${C.accent};">News</span>
                        </span>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>

            <!-- Hero intro -->
            <tr>
              <td style="padding: 36px 32px 24px;">
                <h1 style="margin: 0 0 10px; font: 700 26px/1.25 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.text};">
                  Mirë se erdhe në GjirafaNews 👋
                </h1>
                <p style="margin: 0; font: 400 15px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.textSecondary};">
                  Faleminderit që u regjistrove në newsletter-in tonë. Çdo ditë do të marrësh një përmbledhje të lajmeve më të rëndësishme — politikë, sport, teknologji dhe kulturë.
                </p>
              </td>
            </tr>

            ${articleBlock}

            <!-- What you'll get -->
            <tr>
              <td style="padding: 0 32px 8px;">
                <h3 style="margin: 0 0 12px; font: 600 13px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 1.2px; text-transform: uppercase; color: ${C.textTertiary};">
                  Çfarë do të marrësh
                </h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid ${C.border}; font: 400 14px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.text};">
                      <span style="display: inline-block; width: 8px; height: 8px; background: ${C.accent}; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                      Përmbledhje ditore e lajmeve kryesore nga Kosova dhe Shqipëria
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid ${C.border}; font: 400 14px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.text};">
                      <span style="display: inline-block; width: 8px; height: 8px; background: ${C.accent}; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                      Analiza dhe opinione nga burime të besueshme
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font: 400 14px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.text};">
                      <span style="display: inline-block; width: 8px; height: 8px; background: ${C.accent}; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                      Tema të zgjedhura: politikë, sport, teknologji, kulturë, ekonomi
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding: 28px 32px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: ${C.primary}; border-radius: 12px;">
                  <tr>
                    <td style="padding: 22px 24px;">
                      <p style="margin: 0 0 4px; font: 600 15px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.textInverse};">
                        Eksploro më shumë lajme
                      </p>
                      <p style="margin: 0 0 14px; font: 400 13px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: rgba(255,255,255,0.7);">
                        Vizito faqen tonë për të gjitha lajmet e ditës.
                      </p>
                      <a href="${siteUrl}" style="display: inline-block; background: ${C.accent}; color: ${C.textInverse}; font: 600 13px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 11px 18px; border-radius: 8px; text-decoration: none;">
                        Shko në GjirafaNews
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px 28px; border-top: 1px solid ${C.border}; background: ${C.background};">
                <p style="margin: 0 0 6px; font: 400 12px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.textSecondary};">
                  E ke marrë këtë email sepse u regjistrove në newsletter-in e <strong style="color: ${C.text};">GjirafaNews</strong>.
                </p>
                <p style="margin: 0; font: 400 12px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${C.textTertiary};">
                  Nëse nuk ke qenë ti, thjesht injoro këtë email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
