export function combineDateAndTime(date: string, time?: string): string | null {
  if (!date) return null;
  const local = new Date(`${date}T${time || "00:00"}`);
  return local.toISOString();
}
