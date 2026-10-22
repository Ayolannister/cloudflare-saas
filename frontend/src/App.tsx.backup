import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from '@clerk/react';

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import './App.css';

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'
).replace(/\/+$/, '');

interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
}

interface UploadedFile {
  id: number;
  filename: string;
  size: number;
  content_type: string;
  created_at: string;
}

interface Task {
  id: number;
  project_id: number;
  title: string;
  completed: number | boolean;
  created_at: string;
}

interface TaskAttachment {
  id?: number;
  task_id?: number;
  file_id: number;
  filename: string;
  size?: number;
  content_type?: string;
  created_at?: string;
  attached_at?: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

function getErrorMessage(data: ApiError, fallback: string): string {
  return data.error || data.message || fallback;
}

function isCompleted(task: Task): boolean {
  return task.completed === true || task.completed === 1;
}

function Workspace() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [deleting, setDeleting] = useState('');

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskBusy, setTaskBusy] = useState<number | null>(null);
  const [attachmentsByTask, setAttachmentsByTask] = useState<Record<number, TaskAttachment[]>>({});
  const [attachmentSelections, setAttachmentSelections] = useState<Record<number, string>>({});
  const [attachmentBusy, setAttachmentBusy] = useState<number | null>(null);

  const apiRequest = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const token = await getToken();

      if (!token) {
        throw new Error('Your session token is unavailable. Please sign in again.');
      }

      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${token}`);

      return fetch(`${API_URL}${path}`, { ...init, headers });
    },
    [getToken],
  );

  const loadProjects = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiRequest('/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to load projects.'));
      }

      const nextProjects: Project[] = data.projects ?? [];
      setProjects(nextProjects);
      setSelectedProjectId((current) => {
        if (current !== null && nextProjects.some((project) => project.id === current)) {
          return current;
        }
        return nextProjects[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your projects.');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, isLoaded, isSignedIn]);

  const loadFiles = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setFilesLoading(true);

    try {
      const response = await apiRequest('/files');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to load your files.'));
      }

      setFiles(data.files ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your files.');
    } finally {
      setFilesLoading(false);
    }
  }, [apiRequest, isLoaded, isSignedIn]);

  const loadTasks = useCallback(async (projectId: number) => {
    setTasksLoading(true);
    setError('');

    try {
      const response = await apiRequest(`/projects/${projectId}/tasks`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to load tasks.'));
      }

      const nextTasks: Task[] = data.tasks ?? [];
      setTasks(nextTasks);

      const attachmentResults = await Promise.all(
        nextTasks.map(async (task) => {
          const attachmentResponse = await apiRequest(`/tasks/${task.id}/attachments`);
          const attachmentData = await attachmentResponse.json();

          if (!attachmentResponse.ok) {
            throw new Error(getErrorMessage(attachmentData, `Unable to load attachments for task "${task.title}".`));
          }

          return [task.id, (attachmentData.attachments ?? []) as TaskAttachment[]] as const;
        }),
      );

      setAttachmentsByTask((current) => {
        const next = { ...current };
        for (const [taskId, attachments] of attachmentResults) next[taskId] = attachments;
        for (const key of Object.keys(next)) {
          if (!nextTasks.some((task) => task.id === Number(key))) delete next[Number(key)];
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tasks.');
    } finally {
      setTasksLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    setTasks([]);
    setAttachmentsByTask({});
    if (selectedProjectId !== null && isLoaded && isSignedIn) {
      void loadTasks(selectedProjectId);
    }
  }, [selectedProjectId, isLoaded, isSignedIn, loadTasks]);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!projectName.trim()) {
      setError('Enter a project name.');
      return;
    }

    setCreating(true);
    try {
      const response = await apiRequest('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: description.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to create the project.'));
      }

      setProjectName('');
      setDescription('');
      setSuccess('Project created successfully.');
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the project.');
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedFile) {
      setError('Choose a file to upload.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Files must not exceed 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const response = await apiRequest(`/files?filename=${encodeURIComponent(selectedFile.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
        body: selectedFile,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to upload the file.'));
      }

      setSelectedFile(null);
      const input = document.getElementById('file-upload') as HTMLInputElement | null;
      if (input) input.value = '';
      await loadFiles();
      setSuccess('File uploaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload the file.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(filename: string) {
    setError('');
    setSuccess('');
    setDownloading(filename);

    try {
      const response = await apiRequest(`/files/${encodeURIComponent(filename)}`);

      if (!response.ok) {
        let message = 'Unable to download the file.';
        try {
          message = getErrorMessage(await response.json(), message);
        } catch {
          // Keep the fallback message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setSuccess(`Downloaded ${filename}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download the file.');
    } finally {
      setDownloading('');
    }
  }

  async function handleDelete(filename: string) {
    if (!window.confirm(`Delete "${filename}" permanently? Any task links to this file will also be removed.`)) return;

    setError('');
    setSuccess('');
    setDeleting(filename);

    try {
      const response = await apiRequest(`/files/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to delete the file.'));
      }

      await loadFiles();
      if (selectedProjectId !== null) await loadTasks(selectedProjectId);
      setSuccess(`Deleted ${filename}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the file.');
    } finally {
      setDeleting('');
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedProjectId === null) {
      setError('Create or select a project first.');
      return;
    }
    if (!taskTitle.trim()) {
      setError('Enter a task title.');
      return;
    }

    setError('');
    setSuccess('');
    setCreatingTask(true);

    try {
      const response = await apiRequest(`/projects/${selectedProjectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to create the task.'));
      }

      setTaskTitle('');
      await loadTasks(selectedProjectId);
      setSuccess('Task created successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the task.');
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleToggleTask(task: Task) {
    setError('');
    setSuccess('');
    setTaskBusy(task.id);

    try {
      const response = await apiRequest(`/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !isCompleted(task) }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to update the task.'));
      }

      if (selectedProjectId !== null) await loadTasks(selectedProjectId);
      setSuccess(isCompleted(task) ? 'Task marked as incomplete.' : 'Task completed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update the task.');
    } finally {
      setTaskBusy(null);
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!window.confirm(`Delete the task "${task.title}"?`)) return;

    setError('');
    setSuccess('');
    setTaskBusy(task.id);

    try {
      const response = await apiRequest(`/tasks/${task.id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to delete the task.'));
      }

      if (selectedProjectId !== null) await loadTasks(selectedProjectId);
      setSuccess('Task deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the task.');
    } finally {
      setTaskBusy(null);
    }
  }

  async function handleAttachFile(taskId: number) {
    const selected = attachmentSelections[taskId];
    if (!selected) {
      setError('Choose a file to attach to this task.');
      return;
    }

    setError('');
    setSuccess('');
    setAttachmentBusy(taskId);

    try {
      const response = await apiRequest(`/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: Number(selected) }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to attach the file.'));
      }

      setAttachmentSelections((current) => ({ ...current, [taskId]: '' }));
      if (selectedProjectId !== null) await loadTasks(selectedProjectId);
      setSuccess('File attached to task.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to attach the file.');
    } finally {
      setAttachmentBusy(null);
    }
  }

  async function handleDetachFile(taskId: number, fileId: number, filename: string) {
    if (!window.confirm(`Remove "${filename}" from this task? The stored file will not be deleted.`)) return;

    setError('');
    setSuccess('');
    setAttachmentBusy(taskId);

    try {
      const response = await apiRequest(`/tasks/${taskId}/attachments/${fileId}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to detach the file.'));
      }

      if (selectedProjectId !== null) await loadTasks(selectedProjectId);
      setSuccess('File detached from task. The original file is still stored.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to detach the file.');
    } finally {
      setAttachmentBusy(null);
    }
  }

  return (
    <section className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Projects and tasks</h1>
          <p className="section-description">Organize your work, manage tasks, and attach files in one place.</p>
        </div>
        <UserButton />
      </div>

      {error && (
        <div className="notice" role="alert">
          <span className="notice-icon">!</span>
          <div><strong>Something went wrong</strong><p>{error}</p></div>
        </div>
      )}

      {success && (
        <div className="notice" role="status">
          <span className="notice-icon">✓</span><div><strong>{success}</strong></div>
        </div>
      )}

      <div className="workspace-grid">
        <section className="workspace-panel">
          <h2>Create a project</h2>
          <p className="section-description">Give your project a name and an optional description.</p>
          <form onSubmit={handleCreateProject}>
            <label htmlFor="project-name">Project name</label>
            <input id="project-name" name="name" type="text" maxLength={120} placeholder="e.g. Website redesign" value={projectName} onChange={(event) => setProjectName(event.target.value)} required />
            <label htmlFor="project-description">Description</label>
            <textarea id="project-description" name="description" maxLength={2000} rows={3} placeholder="What is this project about?" value={description} onChange={(event) => setDescription(event.target.value)} />
            <button className="button button-primary" type="submit" disabled={creating}>{creating ? 'Creating…' : '+ New project'}</button>
          </form>
        </section>

        <section className="workspace-panel">
          <h2>Upload a file</h2>
          <p className="section-description">Store a private file. Maximum size: 5 MB. You can attach it to tasks below.</p>
          <form onSubmit={handleUpload}>
            <label htmlFor="file-upload">Choose a file</label>
            <input id="file-upload" type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
            {selectedFile && <p className="file-meta">{selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)} KB</p>}
            <button className="button button-primary" type="submit" disabled={uploading || !selectedFile}>{uploading ? 'Uploading…' : 'Upload file'}</button>
          </form>

          <div className="file-list">
            <h3>Your stored files</h3>
            {filesLoading ? <p className="muted">Loading your files…</p> : files.length === 0 ? (
              <p className="muted">No files yet. Upload your first file above.</p>
            ) : files.map((file) => (
              <div className="file-row" key={file.id}>
                <div>
                  <strong>{file.filename}</strong>
                  <p className="file-meta">{(file.size / 1024).toFixed(1)} KB</p>
                  <p className="file-meta">Uploaded {new Date(file.created_at).toLocaleString()}</p>
                </div>
                <div className="file-actions">
                  <button className="button button-ghost" type="button" disabled={downloading === file.filename || deleting === file.filename} onClick={() => void handleDownload(file.filename)}>{downloading === file.filename ? 'Downloading…' : 'Download'}</button>
                  <button className="button button-ghost" type="button" disabled={deleting === file.filename || downloading === file.filename} onClick={() => void handleDelete(file.filename)}>{deleting === file.filename ? 'Deleting…' : 'Delete'}</button>
                </div>
              </div>
            ))}
            <button className="button button-ghost" type="button" onClick={() => void loadFiles()} disabled={filesLoading}>Refresh files</button>
          </div>
        </section>
      </div>

      <section className="projects-section">
        <div className="projects-section-heading">
          <div>
            <h2>Your projects</h2>
            <p className="section-description">Choose a project to manage its tasks. Only your projects are shown.</p>
          </div>
          <button className="button button-ghost" type="button" onClick={() => void loadProjects()} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>

        {loading ? <div className="empty-state"><h2>Loading your projects…</h2><p>Please wait while we retrieve your workspace.</p></div> : projects.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">▤</div><h2>No projects yet</h2><p>Create your first project using the form above.</p></div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <button
                className={`feature-card project-card project-select-card${selectedProjectId === project.id ? ' project-card-selected' : ''}`}
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                aria-pressed={selectedProjectId === project.id}
              >
                <span className="feature-icon">{String(project.id).padStart(2, '0')}</span>
                <h3>{project.name}</h3>
                <p>{project.description || 'No description provided.'}</p>
                {project.created_at && <small className="muted">Created {project.created_at}</small>}
                <span className="muted">{selectedProjectId === project.id ? 'Selected project' : 'Select project →'}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="projects-section tasks-section">
        <div className="projects-section-heading">
          <div>
            <h2>Tasks</h2>
            <p className="section-description">
              {projects.find((project) => project.id === selectedProjectId)?.name
                ? `Tasks for ${projects.find((project) => project.id === selectedProjectId)?.name}.`
                : 'Select a project to view and create tasks.'}
            </p>
          </div>
          {selectedProjectId !== null && <button className="button button-ghost" type="button" onClick={() => void loadTasks(selectedProjectId)} disabled={tasksLoading}>{tasksLoading ? 'Loading…' : 'Refresh tasks'}</button>}
        </div>

        {selectedProjectId !== null && (
          <form className="task-create-form" onSubmit={handleCreateTask}>
            <label htmlFor="task-title">New task</label>
            <div className="task-create-row">
              <input id="task-title" type="text" maxLength={500} placeholder="e.g. Prepare project documentation" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} required />
              <button className="button button-primary" type="submit" disabled={creatingTask}>{creatingTask ? 'Adding…' : 'Add task'}</button>
            </div>
          </form>
        )}

        {selectedProjectId === null && !loading ? <div className="empty-state"><h2>Select or create a project</h2><p>Tasks belong to a project, so choose a project above first.</p></div> : tasksLoading ? (
          <div className="empty-state"><p>Loading tasks…</p></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state"><h2>No tasks yet</h2><p>Add the first task for this project above.</p></div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => {
              const taskAttachments = attachmentsByTask[task.id] ?? [];
              const attachedFileIds = new Set(taskAttachments.map((attachment) => attachment.file_id));
              const availableFiles = files.filter((file) => !attachedFileIds.has(file.id));

              return (
                <article className={`task-card${isCompleted(task) ? ' task-card-completed' : ''}`} key={task.id}>
                  <div className="task-heading">
                    <div>
                      <span className="task-number">TASK {String(task.id).padStart(3, '0')}</span>
                      <h3>{task.title}</h3>
                      {task.created_at && <p className="file-meta">Created {new Date(task.created_at).toLocaleString()}</p>}
                    </div>
                    <div className="file-actions">
                      <button className="button button-ghost" type="button" disabled={taskBusy === task.id} onClick={() => void handleToggleTask(task)}>
                        {taskBusy === task.id ? 'Saving…' : isCompleted(task) ? 'Mark incomplete' : 'Mark complete'}
                      </button>
                      <button className="button button-ghost" type="button" disabled={taskBusy === task.id} onClick={() => void handleDeleteTask(task)}>
                        Delete task
                      </button>
                    </div>
                  </div>

                  <div className="task-attachments">
                    <h4>Attached files ({taskAttachments.length})</h4>
                    {taskAttachments.length === 0 ? <p className="muted">No files attached to this task yet.</p> : (
                      <ul className="attachment-list">
                        {taskAttachments.map((attachment) => (
                          <li className="attachment-row" key={`${task.id}-${attachment.file_id}`}>
                            <div>
                              <strong>{attachment.filename}</strong>
                              {typeof attachment.size === 'number' && <p className="file-meta">{(attachment.size / 1024).toFixed(1)} KB</p>}
                            </div>
                            <div className="file-actions">
                              <button className="button button-ghost" type="button" disabled={downloading === attachment.filename} onClick={() => void handleDownload(attachment.filename)}>{downloading === attachment.filename ? 'Downloading…' : 'Download'}</button>
                              <button className="button button-ghost" type="button" disabled={attachmentBusy === task.id} onClick={() => void handleDetachFile(task.id, attachment.file_id, attachment.filename)}>{attachmentBusy === task.id ? 'Saving…' : 'Detach'}</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="attach-file-row">
                      <label htmlFor={`attach-file-${task.id}`}>Attach an existing upload</label>
                      <div className="task-create-row">
                        <select
                          id={`attach-file-${task.id}`}
                          value={attachmentSelections[task.id] ?? ''}
                          onChange={(event) => setAttachmentSelections((current) => ({ ...current, [task.id]: event.target.value }))}
                          disabled={availableFiles.length === 0 || attachmentBusy === task.id}
                        >
                          <option value="">Choose a file…</option>
                          {availableFiles.map((file) => <option value={file.id} key={file.id}>{file.filename}</option>)}
                        </select>
                        <button className="button button-primary" type="button" disabled={availableFiles.length === 0 || attachmentBusy === task.id || !attachmentSelections[task.id]} onClick={() => void handleAttachFile(task.id)}>
                          {attachmentBusy === task.id ? 'Attaching…' : 'Attach file'}
                        </button>
                      </div>
                      {filesLoading ? <p className="muted">Loading your uploads…</p> : availableFiles.length === 0 ? <p className="muted">All your uploaded files are attached to this task, or you have not uploaded any files yet.</p> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">C</span>
          <span>Cloudbase</span>
        </a>
        <nav className="nav-actions">
          <Show when="signed-out">
            <SignInButton mode="modal"><button className="button button-ghost">Sign in</button></SignInButton>
            <SignUpButton mode="modal"><button className="button button-primary">Get started</button></SignUpButton>
          </Show>
          <Show when="signed-in"><span className="account-label">Your account</span><UserButton /></Show>
        </nav>
      </header>

      <main>
        <Show when="signed-out">
          <section className="hero">
            <div className="hero-badge">YOUR WORKSPACE, SIMPLIFIED</div>
            <h1>Your projects.<br /><span>Your own space.</span></h1>
            <p className="hero-description">A simple workspace to organize your projects and files. Create an account to get started.</p>
            <div className="hero-actions">
              <SignUpButton mode="modal"><button className="button button-primary button-large">Create your account <span aria-hidden="true">→</span></button></SignUpButton>
              <SignInButton mode="modal"><button className="button button-ghost button-large">I already have an account</button></SignInButton>
            </div>
            <div className="feature-grid">
              <article className="feature-card"><span className="feature-icon">01</span><h2>Organize projects</h2><p>Keep your project information organized in one workspace.</p></article>
              <article className="feature-card"><span className="feature-icon">02</span><h2>Manage files</h2><p>Upload, retrieve, and attach files to your tasks.</p></article>
              <article className="feature-card"><span className="feature-icon">03</span><h2>Your own account</h2><p>Sign in securely and access your personal workspace.</p></article>
            </div>
          </section>
        </Show>
        <Show when="signed-in"><Workspace /></Show>
      </main>

      <footer className="footer"><span>Cloudbase</span><span>Built on Cloudflare</span></footer>
    </div>
  );
}

export default App;
