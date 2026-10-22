import { Link } from 'react-router';

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 rounded-md text-ink" aria-label="Cloudbase home">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <rect x="2" y="6" width="20" height="16" rx="3" fill="var(--color-ink)" />
        <rect x="4" y="2" width="9" height="6" rx="2" fill="var(--color-mark)" />
      </svg>
      <span className="text-[1.0625rem] font-[750] tracking-[-0.02em]">Cloudbase</span>
    </Link>
  );
}
