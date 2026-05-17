# Vercel Deployment Guide - Supabase Connectivity Setup

## 🚀 Critical: Vercel Environment Variables

Before deploying to Vercel, you **must** set these environment variables in your Vercel Project Settings.

### How to Set Environment Variables in Vercel

1. Go to: **https://vercel.com/dashboard**
2. Select your project: **volthub**
3. Click **Settings** → **Environment Variables**
4. Add the following variables for **Production** (and optionally Preview/Development):

---

## ✅ Required Environment Variables

### `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Your Supabase project URL (e.g., `https://tjuabpmmfnqlqbghfhat.supabase.co`)
- **Where to find:** 
  1. Go to https://app.supabase.com → Your Project
  2. Click **Settings** → **API**
  3. Copy **Project URL**
- **Security:** ✅ Safe to expose publicly (it's in `NEXT_PUBLIC_` prefix)
- **Environments:** Production, Preview, Development

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Your Supabase anonymous public key (starts with `eyJ...`)
- **Where to find:**
  1. Go to https://app.supabase.com → Your Project
  2. Click **Settings** → **API**
  3. Copy **Anon public key**
- **Security:** ✅ Safe to expose publicly (it's rate-limited and RLS-protected)
- **Environments:** Production, Preview, Development

### `SUPABASE_SERVICE_ROLE_KEY` (Optional but Recommended)
- **Value:** Your Supabase service role key (secret, do NOT expose to browser)
- **Where to find:**
  1. Go to https://app.supabase.com → Your Project
  2. Click **Settings** → **API**
  3. Copy **Service role key** (marked as "SECRET")
- **Security:** ⚠️ NEVER expose to browser. Server-side only (API routes, server actions)
- **Environments:** Production only (not needed for Preview/Development unless you have server actions)

---

## 🌐 Supabase CORS Configuration

Your deployed domain must be whitelisted in Supabase to prevent CORS errors.

### Step 1: Add Your Vercel Domain to Supabase

1. Go to **https://app.supabase.com** → Your Project
2. Click **Settings** → **API**
3. Scroll to **API Settings** section
4. In **Authorized Redirect URLs**, add:
   ```
   https://volthub1.vercel.app
   https://volthub1.vercel.app/auth/callback
   ```

### Step 2: Add to Auth Redirect URLs (if using Supabase Auth)

1. In the same **Settings** → **Authentication**
2. Under **Site URL**, add:
   ```
   https://volthub1.vercel.app
   ```
3. Under **Redirect URLs**, add:
   ```
   https://volthub1.vercel.app/auth/callback
   https://volthub1.vercel.app/auth/confirm
   ```

### Step 3: Test CORS with cURL

Once deployed, test connectivity:
```bash
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  "https://tjuabpmmfnqlqbghfhat.supabase.co/rest/v1/products?limit=1" \
  -H "Accept: application/json"
```

---

## 🖼️ Image Domain Configuration

The `next.config.ts` now includes image domain whitelisting for Supabase storage.

**Configured Domains:**
- ✅ `tjuabpmmfnqlqbghfhat.supabase.co` (specific Supabase project)
- ✅ `*.supabase.co` (any Supabase project)
- ✅ `images.unsplash.com` (for example images)
- ✅ `via.placeholder.com` (for placeholder images)

**What this does:**
- Allows Next.js `Image` component to optimize images from these domains
- Prevents "Unoptimized Image" warnings in production
- Enables image optimization pipeline

---

## 🔍 Debugging Production Issues

### Check Vercel Build Logs

1. Go to **https://vercel.com/dashboard** → **volthub**
2. Click **Deployments**
3. Click the latest deployment
4. View **Build Logs** for any errors during build time

### Check Browser Console on Deployed Site

1. Open **https://volthub1.vercel.app** in your browser
2. Open **DevTools** → **Console** tab
3. Look for logs starting with `[Supabase]` or `[fetchProducts]`
4. These include diagnostic information:
   - Whether env vars are configured
   - API URLs being called
   - Error details from Supabase API

### Example Diagnostic Output

If env vars are missing, you'll see:
```
[Supabase] CRITICAL: Missing browser environment variables. 
Requests will fail. Check Vercel Project Settings > Environment Variables. 
Diagnosis: { configured: false, url: "MISSING", keyPresent: false, environment: "browser" }
```

If configured correctly:
```
[Supabase] Browser client initialized successfully. 
URL: https://tjuabpmmfnqlqbghfhat.subap...
[fetchProducts] Successfully fetched 12 products
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "Failed to fetch" Error
**Symptom:** Products don't load, console shows "TypeError: Failed to fetch"

**Cause:** Environment variables not set in Vercel or CORS blocked

**Fix:**
1. ✅ Check Vercel Project Settings → Environment Variables have correct keys
2. ✅ Ensure `NEXT_PUBLIC_SUPABASE_URL` is not `undefined`
3. ✅ Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not `undefined`
4. ✅ Redeploy after adding env vars (Vercel doesn't hot-reload them)
5. ✅ Check browser console for diagnosis output

---

### Issue 2: CORS Error
**Symptom:** Console shows CORS error, domain not allowed

**Cause:** Your Vercel domain not whitelisted in Supabase

**Fix:**
1. Go to **https://app.supabase.com** → Your Project → **Settings** → **API**
2. Add `https://volthub1.vercel.app` to **Authorized Redirect URLs**
3. Wait 1-2 minutes for DNS propagation
4. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)

---

### Issue 3: Images Not Loading
**Symptom:** Product cards show broken image icon

**Cause:** Supabase image domain not whitelisted in Next.js config

**Fix:**
✅ Already fixed in `next.config.ts` - the domain `tjuabpmmfnqlqbghfhat.supabase.co` is now whitelisted

---

## 📋 Vercel Project Settings Checklist

Before deploying, verify:

- [ ] **Build Command:** `npm run build`
- [ ] **Install Command:** `npm install`
- [ ] **Output Directory:** Default (`.next`)
- [ ] **Node Version:** 18.x or higher
- [ ] **Environment Variables Set:**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (production, if using server actions)

---

## 🔐 Security Checklist

- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public but RLS-protected in Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is **NEVER** exposed to browser (server-only)
- ✅ Vercel automatic HTTPS ensures encrypted transmission
- ✅ Supabase RLS policies enforce row-level security

---

## 📝 Deployment Checklist

```bash
# 1. Test locally first
npm run build
npm run start

# 2. Verify no TypeScript/ESLint errors (ignored in config, but check anyway)
npm run lint

# 3. Push to main branch
git add .
git commit -m "fix: add Supabase deployment configuration"
git push origin main

# 4. Vercel will auto-deploy
# Monitor at: https://vercel.com/dashboard/volthub

# 5. After deployment, verify:
# - Open https://volthub1.vercel.app
# - Check DevTools Console for [Supabase] logs
# - Verify products load on shop page
# - Test image loading
```

---

## 📞 Support

If you still see connectivity issues after following this guide:

1. **Check Supabase Status:** https://status.supabase.com
2. **Verify API Key Format:** Keys should start with `eyJ` and be ~150+ characters
3. **Test Directly:** Use Postman/cURL to test the API endpoint
4. **Check Supabase Logs:** https://app.supabase.com → Logs tab

---

## Example: Complete Vercel Environment Setup

Here's what your Vercel Environment Variables should look like:

```
NEXT_PUBLIC_SUPABASE_URL=https://tjuabpmmfnqlqbghfhat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWFicG1tZm5xbHFiZ2hmYXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMjI1MDAwMCwiZXhwIjoxNzQzNzg2MDAwfQ.YourVeryLongTokenHere...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdWFicG1tZm5xbHFiZ2hmYXQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzEyMjUwMDAwLCJleHAiOjE3NDM3ODYwMDB9.YourServiceRoleKeyHere...
```

✅ Done! Your Vercel deployment should now connect to Supabase successfully.
