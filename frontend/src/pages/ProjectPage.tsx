import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { EmptyState, InlineError } from '../components/Status';
import { AddTaskForm } from '../features/tasks/AddTaskForm';
import { TaskRow } from '../features/tasks/TaskRow';
import { isDone } from '../lib/api';
import { formatDate, plural } from '../lib/format';
import { useAttachmentsFor, useProjects, useTasks } from '../lib/queries';
import { usePrefs } from '../stores/ui';

export function ProjectPage() {
  const { projectId } = useParams();
  const id = Number(projectId);
  const projects = useProjects();
  const project = projects.data?.find((item) => item.id === id);

  if (projects.isSuccess && !project) {
    return (
      <EmptyState title="This project isn't in your workspace">
        <p>
          It may have been removed, or the link points to someone else's project.{' '}
          <Link to="/projects" className="font-semibold text-ink underline underline-offset-2">
            Go to your projects
          </Link>
          .
        </p>
      </EmptyState>
    );
  }

  if (!project) return <p className="text-sm text-muted">Loading project</p>;

  return <ProjectView key={project.id} projectId={project.id} name={project.name} description={project.description} createdAt={project.created_at} />;
}

interface ProjectViewProps {
  projectId: number;
  name: string;
  description: string | null;
  createdAt: string;
}

function ProjectView({ projectId, name, description, createdAt }: ProjectViewProps) {
  const tasks = useTasks(projectId);
  const hideCompleted = usePrefs((state) => state.hideCompleted);
  const setHideCompleted = usePrefs((state) => state.setHideCompleted);

  const all = useMemo(() => tasks.data ?? [], [tasks.data]);
  const doneCount = all.filter(isDone).length;
  const openTasks = all.filter((task) => !isDone(task));
  const doneTasks = all.filter(isDone);
  const ordered = hideCompleted ? openTasks : [...openTasks, ...doneTasks];
  const attachmentQueries = useAttachmentsFor(ordered.map((task) => task.id));
  const progress = all.length === 0 ? 0 : Math.round((doneCount / all.length) * 100);

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-[2rem] leading-[1.1] font-[750] tracking-[-0.025em] break-words sm:text-[2.5rem]">{name}</h1>
        {description && <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">{description}</p>}
        <div className="mt-1 flex flex-col gap-2">
          <div
            className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-rule"
            role="progressbar"
            aria-label="Tasks done"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-muted">
            {all.length === 0
              ? `Started ${formatDate(createdAt)}`
              : `${doneCount} of ${plural(all.length, 'task')} done. Started ${formatDate(createdAt)}.`}
          </p>
        </div>
      </header>

      <AddTaskForm projectId={projectId} />

      {tasks.isError ? (
        <InlineError message={tasks.error.message} onRetry={() => void tasks.refetch()} />
      ) : tasks.isLoading ? (
        <p className="text-sm text-muted">Loading tasks</p>
      ) : all.length === 0 ? (
        <EmptyState title="No tasks yet">
          <p>Add the first thing that needs doing above. You can attach files to any task.</p>
        </EmptyState>
      ) : (
        <section aria-label="Tasks" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-muted">
              {openTasks.length === 0 ? 'Everything here is done' : `${plural(openTasks.length, 'open task')}`}
            </h2>
            {doneCount > 0 && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-ink)]"
                  checked={hideCompleted}
                  onChange={(event) => setHideCompleted(event.target.checked)}
                />
                Hide done
              </label>
            )}
          </div>
          {ordered.length > 0 && (
            <ul className="panel divide-y divide-rule">
              {ordered.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  attachments={attachmentQueries[index]?.data}
                  attachmentsLoading={attachmentQueries[index]?.isLoading ?? true}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}
