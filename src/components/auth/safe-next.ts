type SearchParam = string | string[] | undefined;

function first(value: SearchParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Where to go after logging in. Only same-site paths are accepted: a single leading
 * slash, no "//" (protocol-relative), no backslashes (browsers read "/\" like "//"),
 * and no control characters. Anything else falls back to the default.
 */
export function safeNextPath(value: SearchParam, fallback = "/today"): string {
  const raw = first(value);
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2000) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  return raw;
}

const GENERIC_NOTICE = "Something went wrong. Try again?";

/**
 * A message handed over in `?error=` (for example by the email-link handler). The text
 * comes from the URL, so only short plain sentences are shown: nothing that could carry
 * a link or markup.
 */
export function readNotice(value: SearchParam): string | undefined {
  const raw = first(value);
  if (typeof raw !== "string") return undefined;
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length === 0) return undefined;
  if (text.length > 140 || /https?:|www\.|[<>]/i.test(text)) return GENERIC_NOTICE;
  return text;
}
