import "server-only";

type Mail = { to: string; subject: string; text: string; html: string };

/** Sends through Resend when configured; otherwise logs so local development still works. */
export async function sendMail(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[mail] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Deen <onboarding@resend.dev>", ...mail }),
  });
  if (!res.ok) console.error("[mail] send failed", res.status, await res.text());
}

export function resetPasswordEmail(name: string, url: string): Omit<Mail, "to"> {
  const greeting = name ? `Assalāmu ʿalaykum ${name},` : "Assalāmu ʿalaykum,";
  return {
    subject: "Reset your Deen password",
    text: `${greeting}\n\nUse the link below to choose a new password. It expires in one hour.\n\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
    html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0e1426">
  <p style="font-size:15px;line-height:1.6">${greeting}</p>
  <p style="font-size:15px;line-height:1.6">Use the button below to choose a new password. The link expires in one hour.</p>
  <p style="margin:28px 0"><a href="${url}" style="background:#0e1426;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;display:inline-block">Choose a new password</a></p>
  <p style="font-size:13px;color:#5d6275;line-height:1.6">If you didn't ask for this, you can safely ignore this email.</p>
</div>`,
  };
}
