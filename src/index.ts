import { verifyToken } from "@clerk/backend";

interface Bindings {
  DB: D1Database;
  cloudflare_saas_files: R2Bucket;
  CLERK_SECRET_KEY: string;
  FRONTEND_ORIGIN?: string;
}

interface AuthUser {
  userId: string;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  clerk_user_id: string;
  created_at: string;
}

interface Task {
  id: number;
  project_id: number;
  title: string;
  completed: number;
  created_at: string;
}

interface FileRecord {
  id: number;
  filename: string;
  object_key: string;
  size: number;
  content_type: string;
  created_at: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function corsHeaders(request: Request, env: Bindings): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowedOrigin = env.FRONTEND_ORIGIN || "http://localhost:5173";
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? origin : allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function isValidFilename(filename: string): boolean {
  return filename.length > 0 && filename.length <= 255 &&
    /^[a-zA-Z0-9._ -]+$/.test(filename) && filename !== "." && filename !== "..";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

function parsePositiveId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function authenticate(request: Request, env: Bindings): Promise<AuthUser | Response> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  try {
    const claims = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    const userId = typeof claims.sub === "string" ? claims.sub : "";
    if (!userId) return json({ error: "Unauthorized" }, 401);
    return { userId };
  } catch {
    return json({ error: "Invalid or expired session" }, 401);
  }
}

function isResponse(value: AuthUser | Response): value is Response {
  return value instanceof Response;
}

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (path === "/" && method === "GET") return json({ name: "cloudflare-saas2-api", status: "running" }, 200, cors);
    if (path === "/health" && method === "GET") return json({ status: "healthy" }, 200, cors);

    const auth = await authenticate(request, env);
    if (isResponse(auth)) {
      const headers = new Headers(auth.headers);
      new Headers(cors).forEach((value, key) => headers.set(key, value));
      return new Response(auth.body, { status: auth.status, headers });
    }
    const userId = auth.userId;

    try {
      // PROJECTS: list and create
      if (path === "/projects" && method === "GET") {
        const result = await env.DB.prepare(
          "SELECT id, name, description, clerk_user_id, created_at FROM projects WHERE clerk_user_id = ? ORDER BY created_at DESC"
        ).bind(userId).all<Project>();
        return json({ projects: result.results ?? [] }, 200, cors);
      }

      if (path === "/projects" && method === "POST") {
        const body = await readJson<{ name?: string; description?: string }>(request);
        const name = body?.name?.trim();
        const description = body?.description?.trim() || null;
        if (!name || name.length > 120) return json({ error: "Project name is required and must be 120 characters or fewer." }, 400, cors);
        const result = await env.DB.prepare(
          "INSERT INTO projects (name, description, clerk_user_id) VALUES (?, ?, ?) RETURNING id, name, description, clerk_user_id, created_at"
        ).bind(name, description, userId).first<Project>();
        return json({ project: result }, 201, cors);
      }

      // TASKS: list/create within a project
      const projectTasksMatch = path.match(/^\/projects\/(\d+)\/tasks$/);
      if (projectTasksMatch) {
        const projectId = parsePositiveId(projectTasksMatch[1]);
        if (!projectId) return json({ error: "Invalid project ID." }, 400, cors);
        const project = await env.DB.prepare(
          "SELECT id FROM projects WHERE id = ? AND clerk_user_id = ?"
        ).bind(projectId, userId).first<{ id: number }>();
        if (!project) return json({ error: "Project not found." }, 404, cors);

        if (method === "GET") {
          const result = await env.DB.prepare(
            "SELECT id, project_id, title, completed, created_at FROM tasks WHERE project_id = ? ORDER BY created_at DESC, id DESC"
          ).bind(projectId).all<Task>();
          return json({ tasks: result.results ?? [] }, 200, cors);
        }
        if (method === "POST") {
          const body = await readJson<{ title?: string }>(request);
          const title = body?.title?.trim();
          if (!title || title.length > 250) return json({ error: "Task title is required and must be 250 characters or fewer." }, 400, cors);
          const task = await env.DB.prepare(
            "INSERT INTO tasks (project_id, title, completed) VALUES (?, ?, 0) RETURNING id, project_id, title, completed, created_at"
          ).bind(projectId, title).first<Task>();
          return json({ task }, 201, cors);
        }
      }

      // Update or delete a task, only if its project belongs to the current user.
      const taskMatch = path.match(/^\/tasks\/(\d+)$/);
      if (taskMatch) {
        const taskId = parsePositiveId(taskMatch[1]);
        if (!taskId) return json({ error: "Invalid task ID." }, 400, cors);
        const task = await env.DB.prepare(
          "SELECT t.id, t.project_id, t.title, t.completed, t.created_at FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ? AND p.clerk_user_id = ?"
        ).bind(taskId, userId).first<Task>();
        if (!task) return json({ error: "Task not found." }, 404, cors);

        if (method === "PATCH") {
          const body = await readJson<{ title?: string; completed?: boolean | number }>(request);
          if (!body || (body.title === undefined && body.completed === undefined)) return json({ error: "Provide title and/or completed." }, 400, cors);
          let title = task.title;
          let completed = task.completed ? 1 : 0;
          if (body.title !== undefined) {
            if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 250) return json({ error: "Task title must be between 1 and 250 characters." }, 400, cors);
            title = body.title.trim();
          }
          if (body.completed !== undefined) {
            if (![true, false, 0, 1].includes(body.completed)) return json({ error: "completed must be a boolean." }, 400, cors);
            completed = body.completed === true || body.completed === 1 ? 1 : 0;
          }
          const updated = await env.DB.prepare(
            "UPDATE tasks SET title = ?, completed = ? WHERE id = ? RETURNING id, project_id, title, completed, created_at"
          ).bind(title, completed, taskId).first<Task>();
          return json({ task: updated }, 200, cors);
        }
        if (method === "DELETE") {
          await env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(taskId).run();
          return json({ success: true }, 200, cors);
        }
      }

      // FILES: list uploaded file metadata
      if (path === "/files" && method === "GET") {
        const result = await env.DB.prepare(
          "SELECT id, filename, object_key, size, content_type, created_at FROM files WHERE clerk_user_id = ? ORDER BY created_at DESC, id DESC"
        ).bind(userId).all<FileRecord>();
        const files = (result.results ?? []).map(({ object_key: _objectKey, ...file }) => file);
        return json({ files }, 200, cors);
      }

      // FILES: upload
      if (path === "/files" && method === "POST") {
        const filename = url.searchParams.get("filename") || "";
        if (!isValidFilename(filename)) return json({ error: "Invalid filename. Use letters, numbers, spaces, dots, underscores, and hyphens." }, 400, cors);
        const contentLength = Number(request.headers.get("Content-Length") || 0);
        if (contentLength > MAX_FILE_SIZE) return json({ error: "File exceeds the 5 MB limit." }, 413, cors);
        const existing = await env.DB.prepare(
          "SELECT id FROM files WHERE clerk_user_id = ? AND filename = ?"
        ).bind(userId, filename).first<{ id: number }>();
        if (existing) return json({ error: "A file with this name already exists. Rename it and upload again." }, 409, cors);

        const data = await request.arrayBuffer();
        if (data.byteLength > MAX_FILE_SIZE) return json({ error: "File exceeds the 5 MB limit." }, 413, cors);
        if (data.byteLength === 0) return json({ error: "Cannot upload an empty file." }, 400, cors);
        const contentType = request.headers.get("Content-Type") || "application/octet-stream";
        const objectKey = `${userId}/${crypto.randomUUID()}/${filename}`;
        await env.cloudflare_saas_files.put(objectKey, data, { httpMetadata: { contentType } });
        try {
          const inserted = await env.DB.prepare(
            "INSERT INTO files (clerk_user_id, filename, object_key, size, content_type) VALUES (?, ?, ?, ?, ?) RETURNING id, filename, size, content_type, created_at"
          ).bind(userId, filename, objectKey, data.byteLength, contentType).first<Omit<FileRecord, "object_key">>();
          return json({ file: inserted }, 201, cors);
        } catch (error) {
          await env.cloudflare_saas_files.delete(objectKey);
          throw error;
        }
      }

      // FILES: download by filename
      const fileMatch = path.match(/^\/files\/(.+)$/);
      if (fileMatch) {
        let filename: string;
        try { filename = decodeURIComponent(fileMatch[1]); } catch { return json({ error: "Invalid filename." }, 400, cors); }
        const file = await env.DB.prepare(
          "SELECT id, filename, object_key, size, content_type, created_at FROM files WHERE clerk_user_id = ? AND filename = ?"
        ).bind(userId, filename).first<FileRecord>();
        if (!file) return json({ error: "File not found." }, 404, cors);

        if (method === "GET") {
          const object = await env.cloudflare_saas_files.get(file.object_key);
          if (!object) return json({ error: "File content is missing from storage." }, 404, cors);
          const headers = new Headers(cors);
          headers.set("Content-Type", file.content_type || "application/octet-stream");
          headers.set("Content-Length", String(file.size));
          headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`);
          headers.set("Cache-Control", "private, no-store");
          return new Response(object.body, { status: 200, headers });
        }

        if (method === "DELETE") {
          await env.DB.prepare("DELETE FROM task_attachments WHERE file_id = ? AND clerk_user_id = ?").bind(file.id, userId).run();
          await env.cloudflare_saas_files.delete(file.object_key);
          await env.DB.prepare("DELETE FROM files WHERE id = ? AND clerk_user_id = ?").bind(file.id, userId).run();
          return json({ success: true }, 200, cors);
        }
      }

      // TASK ATTACHMENTS: list attachments on a task
      const attachmentsMatch = path.match(/^\/tasks\/(\d+)\/attachments$/);
      if (attachmentsMatch) {
        const taskId = parsePositiveId(attachmentsMatch[1]);
        if (!taskId) return json({ error: "Invalid task ID." }, 400, cors);
        const task = await env.DB.prepare(
          "SELECT t.id FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ? AND p.clerk_user_id = ?"
        ).bind(taskId, userId).first<{ id: number }>();
        if (!task) return json({ error: "Task not found." }, 404, cors);

        if (method === "GET") {
          const result = await env.DB.prepare(
            `SELECT f.id, f.filename, f.size, f.content_type, f.created_at, ta.created_at AS attached_at
             FROM task_attachments ta JOIN files f ON f.id = ta.file_id
             WHERE ta.task_id = ? AND ta.clerk_user_id = ? ORDER BY ta.created_at DESC`
          ).bind(taskId, userId).all();
          return json({ attachments: result.results ?? [] }, 200, cors);
        }
        if (method === "POST") {
          const body = await readJson<{ file_id?: number }>(request);
          const fileId = body?.file_id;
          if (typeof fileId !== "number" || !Number.isSafeInteger(fileId) || fileId <= 0) return json({ error: "file_id must be a positive integer." }, 400, cors);
          const file = await env.DB.prepare(
            "SELECT id FROM files WHERE id = ? AND clerk_user_id = ?"
          ).bind(fileId, userId).first<{ id: number }>();
          if (!file) return json({ error: "File not found." }, 404, cors);
          try {
            await env.DB.prepare(
              "INSERT INTO task_attachments (task_id, file_id, clerk_user_id) VALUES (?, ?, ?)"
            ).bind(taskId, fileId, userId).run();
          } catch {
            return json({ error: "This file is already attached to the task, or the attachment could not be saved." }, 409, cors);
          }
          return json({ success: true }, 201, cors);
        }
      }

      // Detach a file from a task without deleting the file itself.
      const detachMatch = path.match(/^\/tasks\/(\d+)\/attachments\/(\d+)$/);
      if (detachMatch && method === "DELETE") {
        const taskId = parsePositiveId(detachMatch[1]);
        const fileId = parsePositiveId(detachMatch[2]);
        if (!taskId || !fileId) return json({ error: "Invalid task or file ID." }, 400, cors);
        const task = await env.DB.prepare(
          "SELECT t.id FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ? AND p.clerk_user_id = ?"
        ).bind(taskId, userId).first<{ id: number }>();
        if (!task) return json({ error: "Task not found." }, 404, cors);
        await env.DB.prepare(
          "DELETE FROM task_attachments WHERE task_id = ? AND file_id = ? AND clerk_user_id = ?"
        ).bind(taskId, fileId, userId).run();
        return json({ success: true }, 200, cors);
      }

      return json({ error: "Route not found." }, 404, cors);
    } catch (error) {
      console.error("API error:", error);
      return json({ error: getErrorMessage(error) }, 500, cors);
    }
  },
} satisfies ExportedHandler<Bindings>;
