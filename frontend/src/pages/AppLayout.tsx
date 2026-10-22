import { UserButton, useAuth } from '@clerk/react';
import type { ReactNode } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router';
import { Brand } from '../components/Brand';
import { FullPageStatus } from '../components/Status';

const navItems = [
  { to: '/projects', label: 'Projects' },
  { to: '/files', label: 'Files' },
];

export function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <FullPageStatus text="Loading your workspace" />;
  if (!isSignedIn) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Brand to="/projects" />
          <nav aria-label="Main" className="flex flex-1 items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    isActive ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <UserButton />
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export function HomeRoute({ landing }: { landing: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <FullPageStatus text="Loading" />;
  if (isSignedIn) return <Navigate to="/projects" replace />;
  return <>{landing}</>;
}
