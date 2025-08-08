This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase Setup

1. Create a Supabase project and get `SUPABASE_URL` and `ANON KEY`.
2. Copy `.env.local.example` to `.env.local` and fill:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Apply the SQL schema in `supabase/schema.sql` using the SQL editor.
4. Create the four storage buckets if not already created by the SQL: `attachments`, `chat-files`, `hr-docs`, `screenshots`.

## Roles & Dashboards
- Admin: `/admin`
- HR: `/hr`
- Team: `/team`
- Client: `/client`

Use `/dashboard` as an entry that auto-redirects based on the logged-in user's role in `profiles.role`.

## Auth
- Email/password sign in is provided at `/login` using Supabase Auth UI.

## Modules (scaffolding)
- `src/modules/projects` for project & task CRUD helpers.
- Extend similarly for HR, Communication, Reporting, and Time Tracking as needed.
