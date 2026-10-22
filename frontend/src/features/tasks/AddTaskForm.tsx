import { useRef, useState, type FormEvent } from 'react';
import { Icon } from '../../components/Icon';
import { useCreateTask } from '../../lib/queries';

export function AddTaskForm({ projectId }: { projectId: number }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask(projectId);

  const trimmed = title.trim();
  const tooLong = trimmed.length > 250;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed || tooLong) return;
    createTask.mutate(trimmed, {
      onSuccess: () => {
        setTitle('');
        inputRef.current?.focus();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <label htmlFor="new-task" className="sr-only">
        New task
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id="new-task"
          className="field h-11"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task and press Enter"
          maxLength={270}
          autoComplete="off"
          aria-invalid={tooLong}
        />
        <button type="submit" className="btn btn-primary h-11 px-4" disabled={!trimmed || tooLong || createTask.isPending}>
          <Icon name="plus" />
          <span className="hidden sm:inline">{createTask.isPending ? 'Adding' : 'Add task'}</span>
          <span className="sr-only sm:hidden">Add task</span>
        </button>
      </div>
      {tooLong && <p className="text-xs text-danger-ink">Keep the task to 250 characters or fewer.</p>}
    </form>
  );
}
