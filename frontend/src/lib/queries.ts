import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from '../stores/ui';
import { useApi, type Attachment, type Project, type StoredFile, type Task } from './api';

export const keys = {
  projects: ['projects'] as const,
  tasks: (projectId: number) => ['tasks', projectId] as const,
  files: ['files'] as const,
  attachments: (taskId: number) => ['attachments', taskId] as const,
  allAttachments: ['attachments'] as const,
};

/* Projects */

export function useProjects() {
  const api = useApi();
  return useQuery({
    queryKey: keys.projects,
    queryFn: async () => (await api.json<{ projects: Project[] }>('/projects')).projects,
  });
}

export function useCreateProject() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description: string }) =>
      (
        await api.json<{ project: Project }>('/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
      ).project,
    onSuccess: (project) => {
      client.setQueryData<Project[]>(keys.projects, (current = []) => [project, ...current]);
      client.setQueryData<Task[]>(keys.tasks(project.id), []);
      toast(`Created ${project.name}.`);
    },
  });
}

/** onDeleted runs from the hook itself, so it still fires after the project's page unmounts. */
export function useDeleteProject(onDeleted?: (project: Project) => void) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (project: Project) => {
      await api.raw(`/projects/${project.id}`, { method: 'DELETE' });
      return project;
    },
    onSuccess: (project) => {
      const tasks = client.getQueryData<Task[]>(keys.tasks(project.id)) ?? [];
      for (const task of tasks) client.removeQueries({ queryKey: keys.attachments(task.id) });
      client.removeQueries({ queryKey: keys.tasks(project.id) });
      client.setQueryData<Project[]>(keys.projects, (current = []) =>
        current.filter((existing) => existing.id !== project.id),
      );
      toast(`Deleted ${project.name}. Its files are still in Files.`);
      onDeleted?.(project);
    },
  });
}

/* Tasks */

function tasksQuery(api: ReturnType<typeof useApi>, projectId: number) {
  return {
    queryKey: keys.tasks(projectId),
    queryFn: async () => (await api.json<{ tasks: Task[] }>(`/projects/${projectId}/tasks`)).tasks,
    staleTime: 30_000,
  };
}

export function useTasks(projectId: number) {
  const api = useApi();
  return useQuery(tasksQuery(api, projectId));
}

/** Loads every project's tasks so the rail can show open counts and switching projects is instant. */
export function useTasksForProjects(projects: Project[]) {
  const api = useApi();
  return useQueries({ queries: projects.map((project) => tasksQuery(api, project.id)) });
}

export function useCreateTask(projectId: number) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) =>
      (
        await api.json<{ task: Task }>(`/projects/${projectId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })
      ).task,
    onSuccess: (task) => {
      client.setQueryData<Task[]>(keys.tasks(projectId), (current = []) => [task, ...current]);
      client.setQueryData<Attachment[]>(keys.attachments(task.id), []);
    },
  });
}

export function useUpdateTask(projectId: number) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; title?: string; completed?: boolean }) =>
      (
        await api.json<{ task: Task }>(`/tasks/${input.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: input.title, completed: input.completed }),
        })
      ).task,
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: keys.tasks(projectId) });
      const previous = client.getQueryData<Task[]>(keys.tasks(projectId));
      client.setQueryData<Task[]>(keys.tasks(projectId), (current = []) =>
        current.map((task) =>
          task.id === input.id
            ? {
                ...task,
                ...(input.title !== undefined && { title: input.title }),
                ...(input.completed !== undefined && { completed: input.completed ? 1 : 0 }),
              }
            : task,
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(keys.tasks(projectId), context.previous);
    },
    onSuccess: (task) => {
      client.setQueryData<Task[]>(keys.tasks(projectId), (current = []) =>
        current.map((existing) => (existing.id === task.id ? task : existing)),
      );
    },
  });
}

export function useDeleteTask(projectId: number) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (task: Task) => {
      await api.raw(`/tasks/${task.id}`, { method: 'DELETE' });
      return task;
    },
    onSuccess: (task) => {
      client.setQueryData<Task[]>(keys.tasks(projectId), (current = []) =>
        current.filter((existing) => existing.id !== task.id),
      );
      client.removeQueries({ queryKey: keys.attachments(task.id) });
      toast(`Deleted "${task.title}".`);
    },
  });
}

/* Files */

export function useFiles() {
  const api = useApi();
  return useQuery({
    queryKey: keys.files,
    queryFn: async () => (await api.json<{ files: StoredFile[] }>('/files')).files,
  });
}

export function useUploadFile() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; filename: string }) =>
      (
        await api.json<{ file: StoredFile }>(`/files?filename=${encodeURIComponent(input.filename)}`, {
          method: 'POST',
          headers: { 'Content-Type': input.file.type || 'application/octet-stream' },
          body: input.file,
        })
      ).file,
    onSuccess: (file) => {
      client.setQueryData<StoredFile[]>(keys.files, (current = []) => [file, ...current]);
    },
  });
}

export function useDeleteFile() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (file: StoredFile) => {
      await api.raw(`/files/${encodeURIComponent(file.filename)}`, { method: 'DELETE' });
      return file;
    },
    onSuccess: (file) => {
      client.setQueryData<StoredFile[]>(keys.files, (current = []) =>
        current.filter((existing) => existing.id !== file.id),
      );
      void client.invalidateQueries({ queryKey: keys.allAttachments });
      toast(`Deleted ${file.filename}.`);
    },
  });
}

export function useDownloadFile() {
  const api = useApi();
  return useCallback(
    async (filename: string) => {
      const response = await api.raw(`/files/${encodeURIComponent(filename)}`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    [api],
  );
}

/* Attachments */

function attachmentsQuery(api: ReturnType<typeof useApi>, taskId: number) {
  return {
    queryKey: keys.attachments(taskId),
    queryFn: async () =>
      (await api.json<{ attachments: Attachment[] }>(`/tasks/${taskId}/attachments`)).attachments,
    staleTime: 30_000,
  };
}

export function useAttachmentsFor(taskIds: number[]) {
  const api = useApi();
  return useQueries({ queries: taskIds.map((taskId) => attachmentsQuery(api, taskId)) });
}

export function useAttachFile(taskId: number) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (file: StoredFile) => {
      await api.raw(`/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: file.id }),
      });
      return file;
    },
    onSuccess: (file) => {
      client.setQueryData<Attachment[]>(keys.attachments(taskId), (current = []) => [
        { ...file, attached_at: new Date().toISOString() },
        ...current,
      ]);
      void client.invalidateQueries({ queryKey: keys.attachments(taskId) });
    },
  });
}

export function useDetachFile(taskId: number) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (file: Attachment) => {
      await api.raw(`/tasks/${taskId}/attachments/${file.id}`, { method: 'DELETE' });
      return file;
    },
    onSuccess: (file) => {
      client.setQueryData<Attachment[]>(keys.attachments(taskId), (current = []) =>
        current.filter((existing) => existing.id !== file.id),
      );
      toast(`Removed ${file.filename} from the task. The file is still in Files.`);
    },
  });
}
