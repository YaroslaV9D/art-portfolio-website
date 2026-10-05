# HIGH CULTURE — personal art portfolio

React + Vite portfolio with the Hyperiux Ring carousel, Motion effects, Lenis smooth scrolling, Supabase-backed projects, and Cloudflare Pages SPA routing.

## What changed in this build

- Projects are loaded from `public.projects` in Supabase; `src/data.js` is no longer used by the app.
- The Ring carousel renders every published project returned by Supabase. There is no hardcoded project limit.
- Supabase Realtime listens for `INSERT`, `UPDATE`, and `DELETE` events on `projects` and refreshes the carousel automatically.
- Each project currently uses one `cover_image_path` from the public `portfolio` Storage bucket.
- Clicking the main artwork on a project page opens a full-screen image preview above the current page. Close it with the Close button, Escape, or by clicking the empty backdrop.
- `public/_redirects` is included so Cloudflare Pages can serve React Router deep links such as `/works/my-painting`.

## Supabase environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Then fill in:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_STORAGE_BUCKET=portfolio
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_PROJECT_ID` are alternatives; keeping both is fine. Do **not** put a Supabase secret/service-role key in this frontend.

## Required `projects` columns

The app expects these existing columns:

- `id`
- `slug`
- `title`
- `description`
- `year`
- `medium`
- `dimensions`
- `cover_image_path`
- `sort_order`
- `is_published`
- `created_at`
- `updated_at`

Only rows with `is_published = true` are shown. The carousel is ordered by `sort_order`, then `created_at`.

For your current Storage layout, values such as this are correct:

```text
cover_image_path = Painting1.jpg
```

because the files are directly in the root of the public `portfolio` bucket.

## Enable instant carousel updates

Run `supabase/enable-realtime.sql` once in the Supabase SQL Editor, or enable the `projects` table under the `supabase_realtime` publication in the Dashboard.

Without Realtime enabled, projects still load normally whenever the page is loaded/focused. With Realtime enabled, adding a published project updates an open carousel automatically.

## Local run

Use a currently supported Node.js version (Node 22+ is recommended):

```bash
npm install
npm run dev
```

Production test:

```bash
npm run build
npm run preview
```

## Cloudflare Pages (later step)

The project is already structurally ready for Cloudflare Pages:

- build command: `npm run build`
- output directory: `dist`
- add the same `VITE_SUPABASE_*` values as Cloudflare build environment variables
- `public/_redirects` preserves React Router project URLs

We can do the actual Cloudflare deployment as the final step.

## Performance update: one Supabase fetch per app session

This build intentionally does **not** subscribe to Supabase Realtime and does not refetch on window focus or visibility changes.

- Projects are fetched once when the app session starts.
- The result is cached in memory so moving between the homepage and project pages does not trigger another Supabase request.
- A sessionStorage copy makes reloads render the last known project list immediately while one fresh request verifies the data.
- If the fresh response is unchanged, the carousel is not re-rendered/re-initialized.
- Adding or editing a Supabase project will appear after a normal browser refresh.

The previous `supabase_realtime` publication setting can remain enabled in Supabase; this frontend simply no longer subscribes to it.

## Carousel sizing refinement

The Ring carousel is intentionally larger on Mac/laptop and iPhone-sized viewports. Responsive Ring scale now ranges from `0.66` on compact phones to `1.12` on large desktop screens, with slightly larger base cards (`96 × 150`).
