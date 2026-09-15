# MySite-The-New-One

Rebuild from the ground up of my personal site

## Built-in CMS

All page content (home intro, contact links, skills, works, press, pinball scores, and blog posts) is
editable at `/admin` without touching any code — no external CMS service, just SvelteKit.

- **Storage**: a SQLite database at `data/cms.sqlite3` (via `better-sqlite3`), created automatically
  with sensible defaults on first run. `src/lib/server/db.ts` opens the connection and creates the
  tables; `src/lib/server/content.ts` reads/writes page content (one row per section in
  `content_sections`), and `src/lib/server/auth.ts` reads/writes the admin password and login sessions
  (`admin_user` / `sessions` tables). The whole `data/` folder is gitignored — it's runtime data, not
  source.
- **Auth**: a single admin account with no separate user database — the password hash lives in the
  `admin_user` table. The very first visit to `/admin` on a fresh database redirects to `/admin/setup`
  to create that password; it can be changed later at `/admin/settings`. Login sessions are random
  tokens stored in the `sessions` table, referenced by an opaque cookie.
- **Hosting requirement**: because content and login state are saved to disk, this app must run as a
  persistent Node process (it uses `@sveltejs/adapter-node`) — e.g. on a VPS, not on a serverless/edge
  platform where the filesystem is ephemeral or read-only. `better-sqlite3` also needs its native
  module built for the target platform (`npm install` handles this automatically).

To use it locally:

```bash
npm install
npm run dev
```

Then visit `/admin` — on a fresh database you'll be prompted to create the admin password at
`/admin/setup`. After that, log in and edit any section — changes save immediately and are reflected on
the live pages right away.

## Tools (For Now)

- Vite
- Svelte
- SvelteKit
- TailwindCSS (Sorry, I caved)

## Languages

- TypeScript Frontend
- TBD Backend, if needed

## IDE

- JetBrains Webstorm

## Main Development Operating System

- CachyOS
