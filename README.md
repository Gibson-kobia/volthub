# VoltHub

VoltHub is a gadget e-commerce website built with Next.js (App Router) and Supabase.

## Environment Variables

This project uses Supabase for the backend. You must set the following environment variables in `.env.local` for local development, or in your deployment platform (e.g., Netlify/Vercel) settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

If these are missing, the storefront still renders using built-in sample products, but checkout/admin actions that require Supabase will fail.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
