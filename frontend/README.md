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

## Deploying to Cloudflare Pages

1. Set the build command to `npm run build` and the output folder to `dist`, with `frontend` as the root directory.
2. Add `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_BASE_URL` (your Worker URL) as Pages environment variables.
3. Set `FRONTEND_ORIGIN` in the root `wrangler.jsonc` to your Pages URL, then redeploy the Worker so CORS allows it.
4. `public/_headers` adds security headers and long caching for hashed assets.

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
