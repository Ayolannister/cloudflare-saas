import { SignInButton, SignUpButton } from '@clerk/react';
import { Brand } from '../components/Brand';
import { Icon } from '../components/Icon';

const sampleProjects = [
  { name: 'Shop relaunch', open: 3, active: true },
  { name: 'Tax filing', open: 2, active: false },
  { name: 'Apartment move', open: 5, active: false },
];

const sampleTasks = [
  { title: 'Confirm the print quote with the vendor', files: 1, done: false },
  { title: 'Write delivery terms for Lagos and Abuja', files: 0, done: false },
  { title: 'Upload the new size chart', files: 2, done: false },
  { title: 'Shoot product photos', files: 4, done: true },
];

export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Brand />
        <div className="flex items-center gap-1">
          <SignInButton mode="modal">
            <button type="button" className="btn btn-quiet">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className="btn btn-primary">
              Create account
            </button>
          </SignUpButton>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16 lg:py-16">
        <div className="max-w-[34rem]">
          <h1 className="text-[2.75rem] leading-[1.02] font-[800] tracking-[-0.035em] sm:text-[3.75rem]">
            Projects, tasks and the files that go with them.
          </h1>
          <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted">
            Keep each project's to-do list next to its documents. The quote, the brief and the screenshot sit on the task
            they belong to, private to your account.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <SignUpButton mode="modal">
              <button type="button" className="btn btn-primary h-11 px-5 text-[0.9375rem]">
                Create your workspace
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button type="button" className="btn btn-quiet h-11 px-4 text-[0.9375rem]">
                I already have an account
              </button>
            </SignInButton>
          </div>
          <p className="mt-6 text-sm text-muted">Files up to 5 MB each. Sign in with email or a social account.</p>
        </div>

        <Preview />
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">
        Cloudbase runs on Cloudflare Workers, D1 and R2.
      </footer>
    </div>
  );
}

/** A non-interactive picture of the workspace, built from the same styles as the real thing. */
function Preview() {
  const done = sampleTasks.filter((task) => task.done).length;
  return (
    <figure aria-label="Preview of a project in Cloudbase" className="rotate-[0.6deg] rounded-[20px] bg-rule/60 p-2 sm:p-3">
      <div className="grid gap-3 rounded-[14px] bg-ground p-3 sm:grid-cols-[9.5rem_1fr] sm:p-4" aria-hidden="true">
        <ul className="hidden flex-col gap-0.5 sm:flex">
          {sampleProjects.map((project) => (
            <li
              key={project.name}
              className={`flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-[0.8125rem] ${
                project.active ? 'bg-surface font-semibold' : 'text-muted'
              }`}
            >
              <span className={`truncate ${project.active ? 'highlight' : ''}`}>{project.name}</span>
              <span className="text-xs text-muted">{project.open}</span>
            </li>
          ))}
        </ul>
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <p className="text-lg leading-tight font-[750] tracking-[-0.02em]">Shop relaunch</p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-rule">
              <div className="h-full bg-ink" style={{ width: `${(done / sampleTasks.length) * 100}%` }} />
            </div>
          </div>
          <ul className="panel divide-y divide-rule">
            {sampleTasks.map((task) => (
              <li key={task.title} className="flex items-start gap-2.5 px-3 py-2.5">
                <span
                  className={`mt-px grid size-4 shrink-0 place-items-center rounded-[5px] border-[1.5px] ${
                    task.done ? 'border-mark bg-mark text-on-mark' : 'border-muted/60 text-transparent'
                  }`}
                >
                  <Icon name="check" width={11} height={11} strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <p className={`text-[0.8125rem] leading-snug ${task.done ? 'text-muted line-through' : ''}`}>{task.title}</p>
                  {task.files > 0 && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-muted">
                      <Icon name="clip" width={11} height={11} />
                      {task.files === 1 ? '1 file' : `${task.files} files`}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}
