export function isoDateLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysSinceLaunch(launchDate: Date, today = new Date()): number {
  const ms = startOfLocalDay(today).getTime() - startOfLocalDay(launchDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

