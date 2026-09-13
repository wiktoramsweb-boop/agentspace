/** Link do programu pocztowego. Długie treści ucinamy, bo mailto ma limit długości. */
export function mailtoHref(to: string | null | undefined, subject: string, body: string): string {
  const b = body.length > 1800 ? `${body.slice(0, 1800)}\n\n[...]` : body;
  return `mailto:${encodeURIComponent(to ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(b)}`;
}

/** Link do aplikacji SMS w telefonie z gotową treścią. */
export function smsHref(phone: string | null | undefined, body: string): string {
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  return `sms:${digits}?&body=${encodeURIComponent(body)}`;
}
