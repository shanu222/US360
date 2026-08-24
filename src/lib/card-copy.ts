export function cardKicker(value?: string | null) {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (/us360|from your chat|created by|from us360/i.test(v)) return "";
  return v;
}
