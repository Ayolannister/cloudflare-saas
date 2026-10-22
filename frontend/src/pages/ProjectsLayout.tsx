import { Navigate, Outlet } from 'react-router';
import { EmptyState, InlineError } from '../components/Status';
import { NewProjectForm } from '../features/projects/NewProjectForm';
import { ProjectRail } from '../features/projects/ProjectRail';
import { useProjects } from '../lib/queries';

export function ProjectsLayout() {
  const projects = useProjects();

  if (projects.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <InlineError message={projects.error.message} onRetry={() => void projects.refetch()} />
      </main>
    );
  }

  if (projects.isLoading || !projects.data) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm text-muted" role="status">
          Loading projects
        </p>
      </main>
    );
  }

  if (projects.data.length === 0) {
    return (
      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_24rem] lg:py-16">
        <div className="max-w-xl">
          <h1 className="text-[2rem] leading-[1.1] font-[750] tracking-[-0.025em] sm:text-[2.5rem]">Start your first project</h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
            A project holds a list of tasks. Each task can carry the files that go with it, like a brief, a quote or a
            screenshot.
          </p>
        </div>
        <div className="panel p-5 sm:p-6">
          <NewProjectForm autoFocus />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-10 lg:py-10">
      <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <ProjectRail projects={projects.data} />
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </main>
  );
}

/** /projects with no id opens the most recent project. */
export function ProjectsIndex() {
  const projects = useProjects();
  const first = projects.data?.[0];
  if (first) return <Navigate to={`/projects/${first.id}`} replace />;
  return <EmptyState title="Choose a project" />;
}

