# Cloudbase frontend

React app for the Cloudbase Worker API: projects, tasks, and private files you can attach to tasks.

## Stack

- Vite, React 19, TypeScript
- Tailwind CSS v4 (tokens in `src/index.css`, no component kit)
- TanStack Query for server data, Zustand for toasts and saved preferences
- React Router
- Clerk for sign-in (the Worker verifies the session token on every request)
- Schibsted Grotesk, self-hosted through Fontsource

## Run it locally

1. Start the API from the repo root:

   ```
   npx wrangler dev
   ```

2. In a second terminal, go to the frontend:

   ```
   cd frontend
   ```

3. Install dependencies:

   ```
   npm install
   ```

4. Create your env file:

   ```
   cp .env.example .env
   ```

5. Put your Clerk publishable key in `.env` as `VITE_CLERK_PUBLISHABLE_KEY`.

6. Start the dev server:

   ```
   npm run dev
   ```

7. Open http://localhost:5173.

## Checks

```
npm run lint
npm run build
```

## Deploying

The frontend is hosted on Vercel. The API stays on Cloudflare Workers, because it uses D1 and R2 directly.

### 1. Deploy the API (once, and after API changes)

From the repo root:

1. Set the Clerk secret on the Worker:

   ```
   npx wrangler secret put CLERK_SECRET_KEY
   ```

2. Apply database migrations to the remote D1 database:

   ```
   npx wrangler d1 migrations apply cloudflare-saas-db --remote
   ```

3. Deploy:

   ```
   npx wrangler deploy
   ```

4. Note the Worker URL it prints (something like `https://cloudflare-saas2.<you>.workers.dev`).

### 2. Deploy the frontend to Vercel

1. In Vercel, choose Add New > Project and import `Ayolannister/cloudflare-saas`.
2. Set Root Directory to `frontend`. Vercel reads the rest from `vercel.json`.
3. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`: your Clerk publishable key
   - `VITE_API_BASE_URL`: the Worker URL from step 1.4
4. Click Deploy and copy the production URL.

### 3. Allow the Vercel URL to call the API

1. In the root `wrangler.jsonc`, add the Vercel URL to `FRONTEND_ORIGIN`, comma-separated:

   ```
   "FRONTEND_ORIGIN": "https://your-app.vercel.app,http://localhost:5173"
   ```

2. Redeploy the Worker:

   ```
   npx wrangler deploy
   ```

3. If you use a Clerk production instance, add the Vercel domain in the Clerk dashboard. A development instance works on any domain.

`vercel.json` sends every route to `index.html` so deep links like `/projects/3` load, adds security headers, and caches hashed assets for a year.

## Layout

```
src/
  app/          router and providers (query client, cache reset on sign-out)
  components/   brand, icons, toasts, confirm button, status blocks
  features/     projects, tasks and files UI pieces
  lib/          API client, typed queries and mutations, formatting
  pages/        landing, project, files, not found
  stores/       Zustand stores
```
