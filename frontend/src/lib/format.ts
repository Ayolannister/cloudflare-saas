const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** D1 stores CURRENT_TIMESTAMP as "YYYY-MM-DD HH:MM:SS" in UTC with no zone marker. */
export function parseDbDate(value: string): Date {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value;
  return new Date(normalized);
}

export function formatDate(value: string): string {
  const date = parseDbDate(value);
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}

export function formatDateTime(value: string): string {
  const date = parseDbDate(value);
  return Number.isNaN(date.getTime()) ? value : `${dateFormat.format(date)}, ${timeFormat.format(date)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Turns any filename into one the API accepts: letters, numbers, spaces, dots, underscores, hyphens. */
export function safeFilename(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^\w. -]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-. ]+/, '')
    .trim()
    .slice(0, 255);
  return cleaned === '' || cleaned === '.' || cleaned === '..' ? 'file' : cleaned;
}
