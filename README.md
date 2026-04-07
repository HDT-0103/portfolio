Portfolio website built with [Next.js](https://nextjs.org) + Supabase.

## Getting Started

1) Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Projects (Featured Projects)

Featured Projects are stored in Supabase (instead of static data).

1) Create the table + policies in Supabase SQL editor:

- `supabase/projects.sql`

2) (Optional) Seed sample projects:

- `supabase/seed_projects.sql`

2) Ensure you have these env vars in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Admin (CRUD Projects)

The site includes an admin page at `/admin` that calls server-side API routes:

- `GET /api/projects` (public: featured + published only; admin: all)
- `POST /api/projects` (admin)
- `PATCH /api/projects/:id` (admin)
- `DELETE /api/projects/:id` (admin)

Add these env vars for admin mode:

- `ADMIN_TOKEN` (a random secret string)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase service role key; keep server-only)

In the `/admin` UI, paste `ADMIN_TOKEN` to load and manage projects.

## GitHub Import / Sync (Optional)

The admin page can prefill or sync project fields from GitHub.

- API: `GET /api/github/repo?url=https://github.com/<owner>/<repo>`
- Optional env: `GITHUB_TOKEN` (recommended to avoid GitHub rate limits)

## Images

`image_url` can be a local path (e.g. `/images/my.png` in `public/`) or a full public URL (e.g. from Supabase Storage).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
