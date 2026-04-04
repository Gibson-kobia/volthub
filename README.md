# Zora

Zora is a Nairobi-first e-commerce storefront built with Next.js (App Router) and Supabase. The store focuses on groceries, drinks, snacks, household essentials, personal care, and a featured VoltHub electronics department.

## Environment Variables

This project uses Supabase for the backend. You must set the following environment variables in `.env.local` for local development, or in your deployment platform settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

If these are missing, the storefront will still build, but product queries and checkout/admin actions that require Supabase will not work correctly at runtime.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

This app is Vercel-compatible as-is and builds with:

```bash
npm run build
```

Before deploying on Vercel, set these project environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Recommended Vercel settings:

- Framework preset: `Next.js`
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: leave default

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
