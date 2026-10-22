import { useState, type FormEvent } from 'react';
import { ConfirmButton } from '../../components/ConfirmButton';
import { Icon } from '../../components/Icon';
import { isDone, type Attachment, type Task } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useDeleteTask, useUpdateTask } from '../../lib/queries';
import { TaskAttachments } from './TaskAttachments';

interface TaskRowProps {
  task: Task;
  attachments: Attachment[] | undefined;
  attachmentsLoading: boolean;
}

export function TaskRow({ task, attachments, attachmentsLoading }: TaskRowProps) {
  const done = isDone(task);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const updateTask = useUpdateTask(task.project_id);
  const deleteTask = useDeleteTask(task.project_id);

  const count = attachments?.length ?? 0;
  const panelId = `task-${task.id}-files`;

  function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || title.length > 250) return;
    if (title !== task.title) updateTask.mutate({ id: task.id, title });
    setEditing(false);
  }

  return (
    <li className="group px-4 py-3 sm:px-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
          onClick={() => updateTask.mutate({ id: task.id, completed: !done })}
          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] transition-colors ${
            done ? 'border-mark bg-mark text-on-mark' : 'border-muted/60 text-transparent hover:border-ink'
          }`}
        >
          <Icon name="check" width={14} height={14} strokeWidth={2.2} />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={saveTitle} className="flex flex-wrap gap-2">
              <label htmlFor={`edit-${task.id}`} className="sr-only">
                Task title
              </label>
              <input
                id={`edit-${task.id}`}
                className="field h-9 min-w-0 flex-1"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setDraft(task.title);
                    setEditing(false);
                  }
                }}
                maxLength={250}
                autoFocus
              />
              <button type="submit" className="btn btn-primary h-9" disabled={!draft.trim()}>
                Save
              </button>
              <button
                type="button"
                className="btn btn-quiet h-9"
                onClick={() => {
                  setDraft(task.title);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <p
              className={`text-[0.9375rem] leading-snug break-words ${done ? 'text-muted line-through decoration-muted/70' : ''}`}
            >
              {task.title}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>Added {formatDate(task.created_at)}</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded font-semibold hover:text-ink"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((value) => !value)}
            >
              <Icon name="clip" width={13} height={13} />
              {attachmentsLoading ? 'Files' : count === 0 ? 'Attach files' : count === 1 ? '1 file' : `${count} files`}
            </button>
          </div>
        </div>

        {!editing && (
          <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <button
              type="button"
              className="btn btn-quiet btn-icon"
              onClick={() => {
                setDraft(task.title);
                setEditing(true);
              }}
              aria-label={`Rename "${task.title}"`}
              title="Rename"
            >
              <Icon name="pencil" />
            </button>
            <ConfirmButton
              label={`Delete "${task.title}"`}
              confirmLabel="Delete task"
              busy={deleteTask.isPending}
              onConfirm={() => deleteTask.mutate(task)}
            />
          </div>
        )}
      </div>

      {expanded && (
        <div id={panelId} className="mt-3 sm:ml-8">
          <TaskAttachments taskId={task.id} attachments={attachments} loading={attachmentsLoading} />
        </div>
      )}
    </li>
  );
}
