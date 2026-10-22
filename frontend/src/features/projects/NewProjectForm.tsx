import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCreateProject } from '../../lib/queries';

interface NewProjectFormProps {
  onDone?: () => void;
  autoFocus?: boolean;
  showCancel?: boolean;
}

export function NewProjectForm({ onDone, autoFocus = false, showCancel = false }: NewProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createProject = useCreateProject();
  const navigate = useNavigate();

  const trimmed = name.trim();
  const tooLong = trimmed.length > 120;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed || tooLong) return;
    createProject.mutate(
      { name: trimmed, description: description.trim() },
      {
        onSuccess: (project) => {
          setName('');
          setDescription('');
          onDone?.();
          navigate(`/projects/${project.id}`);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="project-name" className="text-sm font-semibold">
          Project name
        </label>
        <input
          id="project-name"
          className="field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Shop relaunch"
          maxLength={140}
          autoFocus={autoFocus}
          required
          aria-invalid={tooLong}
          aria-describedby={tooLong ? 'project-name-error' : undefined}
        />
        {tooLong && (
          <p id="project-name-error" className="text-xs text-danger-ink">
            Keep the name to 120 characters or fewer.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="project-description" className="text-sm font-semibold">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="project-description"
          className="field h-auto min-h-20 resize-y py-2 leading-snug"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What this project is for"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={!trimmed || tooLong || createProject.isPending}>
          {createProject.isPending ? 'Creating project' : 'Create project'}
        </button>
        {showCancel && (
          <button type="button" className="btn btn-quiet" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
