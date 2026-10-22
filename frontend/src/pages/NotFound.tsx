import { Link } from 'react-router';
import { Brand } from '../components/Brand';

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-6">
      <Brand />
      <main className="flex flex-1 flex-col items-start justify-center gap-4 py-16">
        <h1 className="text-[2.5rem] leading-[1.05] font-[750] tracking-[-0.03em]">There's no page at this address</h1>
        <p className="text-muted">Check the link, or go back to your workspace.</p>
        <Link to="/" className="btn btn-primary">
          Go to your workspace
        </Link>
      </main>
    </div>
  );
}
