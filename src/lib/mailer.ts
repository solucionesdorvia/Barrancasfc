/**
 * Mailer env-gated. Si no hay RESEND_API_KEY (caso default en dev / preview),
 * todas las funciones son no-op y devuelven `{ skipped: true }`.
 *
 * Cuando el cliente nos pase la API key de Resend, la metemos en Railway y
 * automáticamente empieza a mandar mails reales. No hace falta cambiar nada
 * del código que llama.
 *
 * Uso típico:
 *   import { sendMail } from "@/lib/mailer";
 *   await sendMail({ to, subject, html });
 *
 * Llamadas desde API routes:
 *   - Al crear aviso → notificar a padres
 *   - Apto físico próximo a vencer → recordatorio
 *   - Invitación creada → mandar link automático
 */

type SendInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** From override, default a noreply@<RESEND_FROM_DOMAIN> */
  from?: string;
};

type SendResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

const FROM_DEFAULT = process.env.RESEND_FROM_EMAIL || "NEXCLUB <noreply@nexclub.app>";
const REPLY_TO = process.env.RESEND_REPLY_TO;

export function isMailerEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendMail(input: SendInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No-op silencioso. Logueamos en dev para que sea visible que se omitió.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[mailer] skipped (no RESEND_API_KEY) → to=${input.to} subject="${input.subject}"`);
    }
    return { ok: false, skipped: true, reason: "RESEND_API_KEY not set" };
  }

  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const payload: Record<string, unknown> = {
    from: input.from ?? FROM_DEFAULT,
    to: recipients,
    subject: input.subject,
    html: input.html,
  };
  if (input.text) payload.text = input.text;
  if (REPLY_TO) payload.reply_to = REPLY_TO;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      console.error(`[mailer] resend ${res.status}: ${errText}`);
      return { ok: false, error: `Resend ${res.status}: ${errText.slice(0, 200)}` };
    }
    const data = await res.json();
    return { ok: true, id: data.id ?? "unknown" };
  } catch (e) {
    console.error("[mailer] network error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

/**
 * Notificación de nuevo aviso del club a todos los padres con email.
 * No-op si mailer está apagado o no hay destinatarios.
 */
export async function sendNoticeNotification(opts: {
  recipients: string[];
  noticeTitle: string;
  noticeBody: string;
  isPoll?: boolean;
  appUrl?: string;
  /** Nombre del club que firma el mensaje. Si no viene, omite la línea. */
  clubName?: string;
  /** Color primario del club para el botón del mail. Default: NexClub. */
  clubPrimaryHex?: string;
}) {
  const valid = opts.recipients.filter((r) => /\S+@\S+\.\S+/.test(r));
  if (valid.length === 0) return { ok: false, skipped: true, reason: "no recipients" } as const;

  const buttonColor = opts.clubPrimaryHex ?? "#0F766E";
  const club = opts.clubName ?? "tu club";
  const link = opts.appUrl
    ? `<p style="margin:24px 0;"><a href="${opts.appUrl}/padre/avisos" style="background:${buttonColor};color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Abrir el aviso</a></p>`
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
      <h1 style="font-size:18px;color:#0f172a;margin:0 0 6px;">${opts.isPoll ? "🗳️ Nueva encuesta del club" : "📣 Nuevo aviso del club"}</h1>
      <h2 style="font-size:22px;color:#0f172a;margin:8px 0 12px;">${escapeHtml(opts.noticeTitle)}</h2>
      <div style="font-size:14px;color:#334155;line-height:1.6;white-space:pre-line;">${escapeHtml(opts.noticeBody)}</div>
      ${link}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="font-size:11px;color:#94a3b8;margin:0 0 4px;">Estás recibiendo este mail porque sos parte de ${escapeHtml(club)}.</p>
      <p style="font-size:10px;color:#cbd5e1;margin:0;">Enviado desde NEXCLUB · plataforma de gestión del club.</p>
    </div>
  `;

  // Para evitar exponer la lista, mandamos uno a uno (Resend acepta bulk pero
  // así cada padre recibe un mail personal sin ver al resto).
  const results = await Promise.all(
    valid.map((to) =>
      sendMail({
        to,
        subject: opts.isPoll ? `🗳️ ${opts.noticeTitle}` : `📣 ${opts.noticeTitle}`,
        html,
      })
    )
  );

  const sent = results.filter((r) => r.ok).length;
  return { ok: true, sent, total: valid.length } as const;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
