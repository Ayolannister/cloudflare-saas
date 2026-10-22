import { useState } from 'react';
import { NavLink } from 'react-router';
import { Icon } from '../../components/Icon';
import { isDone, type Project } from '../../lib/api';
import { useTasksForProjects } from '../../lib/queries';
import { NewProjectForm } from './NewProjectForm';

export function ProjectRail({ projects }: { projects: Project[] }) {
  const [creating, setCreating] = useState(false);
  const taskQueries = useTasksForProjects(projects);

  return (
    <nav aria-label="Projects" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">Projects</h2>
        {!creating && (
          <button type="button" className="btn btn-quiet h-8 px-2.5" onClick={() => setCreating(true)}>
            <Icon name="plus" />
            New project
          </button>
        )}
      </div>

      {creating && (
        <div className="panel p-4">
          <NewProjectForm autoFocus showCancel onDone={() => setCreating(false)} />
        </div>
      )}

      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {projects.map((project, index) => {
          const tasks = taskQueries[index]?.data;
          const open = tasks?.filter((task) => !isDone(task)).length;
          return (
            <li key={project.id} className="shrink-0">
              <NavLink
                to={`/projects/${project.id}`}
                className={({ isActive }) =>
                  `flex items-baseline justify-between gap-4 rounded-lg px-3 py-2.5 text-[0.9375rem] lg:px-3 ${
                    isActive ? 'bg-surface font-semibold' : 'text-muted hover:bg-surface/60 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`max-w-[14rem] truncate ${isActive ? 'highlight' : ''}`}>{project.name}</span>
                    <span
                      className="text-sm text-muted tabular-nums"
                      aria-label={open === undefined ? undefined : `${open} open tasks`}
                    >
                      {open ?? ''}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
