# Canvus Database - Setup Checklist

## Pre-Import Verification

Before importing the schema, verify your Supabase project is ready:

- [ ] Supabase project created at https://app.supabase.com
- [ ] Project is active and responding
- [ ] You have access to the SQL Editor in Supabase dashboard
- [ ] No existing tables (or you've backed them up)

---

## Import Steps

### Step 1: Go to Supabase SQL Editor
```
https://app.supabase.com 
  → Select Your Project 
  → SQL Editor (left sidebar)
```

### Step 2: Create New Query
- Click "New Query"
- Or click "+" next to "Favorites"
- Name it: "Canvus Schema Import" (optional)

### Step 3: Copy Schema
1. Open `/workspaces/volthub/supabase/schema.sql` in your editor
2. Select all: `Ctrl+A` (or Cmd+A on Mac)
3. Copy: `Ctrl+C`

### Step 4: Paste into Supabase
1. Click in the SQL editor text area
2. Paste: `Ctrl+V`
3. You should see ~1000+ lines of SQL

### Step 5: Execute
1. Click the "Run" button (▶️ icon, top-right)
2. OR Press: `Ctrl+Enter` (or `Cmd+Enter` on Mac)

### Step 6: Monitor Progress
- Watch the bottom panel for status
- You'll see "Success" for each statement
- Wait for: "Execution finished in X seconds"

### Step 7: Verify Tables
1. Refresh your browser with the SQL Editor
2. Go to "Table Editor" in left sidebar
3. You should see all 12 tables:
   ```
   ✓ profiles
   ✓ staff_profiles
   ✓ categories
   ✓ products
   ✓ wholesale_prices
   ✓ inventory_tracking
   ✓ inventory_movements
   ✓ orders
   ✓ order_items
   ✓ mpesa_payments
   ✓ order_returns
   ✓ product_reviews
   ```

---

## If Import Fails

### Error: "Duplicate Table"
**Cause:** Tables already exist
**Fix:**
```sql
-- Option 1: Drop and recreate (DELETES ALL DATA)
DROP TABLE IF EXISTS order_returns CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS mpesa_payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventory_tracking CASCADE;
DROP TABLE IF EXISTS wholesale_prices CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Then run schema.sql again

-- Option 2: Backup existing data first
-- Contact support for data export
```

### Error: "Syntax Error"
**Cause:** Paste was incomplete or copied wrong
**Fix:**
1. Delete everything in editor
2. Reload the page
3. Delete all partial tables from Supabase
4. Carefully copy-paste entire schema.sql again
5. Check for any extra/missing quotes

### Error: "UUID Generator Not Found"
**Cause:** Extension not enabled
**Fix:** Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Error: "Enum Type Already Exists"
**Cause:** Partial import from previous attempt
**Fix:** Drop all enums first:
```sql
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;
```

---

## Post-Import Setup

Once schema imports successfully:

### Add Sample Data
```sql
-- Add a category
INSERT INTO public.categories (name, slug, description, display_order, is_active)
VALUES ('Staples', 'staples', 'Grains, flour, sugar', 1, true);

-- Add a product
INSERT INTO public.products (
  name, slug, category_id, retail_price, retail_unit, 
  retail_stock, sku, is_active
)
SELECT
  'Sugar - Kabras White',
  'sugar-kabras-white',
  (SELECT id FROM categories WHERE slug = 'staples'),
  120,
  '1kg',
  500,
  'SUGAR-WHITE-001',
  true;

-- Add wholesale pricing
INSERT INTO public.wholesale_prices (
  product_id, tier_level, unit_price, bulk_quantity_min, bulk_unit, 
  weight_per_unit, is_active
)
SELECT
  (SELECT id FROM products WHERE slug = 'sugar-kabras-white'),
  'tier1',
  4500,
  5,
  '50kg Bag',
  50,
  true;

-- Add another tier
INSERT INTO public.wholesale_prices (
  product_id, tier_level, unit_price, bulk_quantity_min, bulk_unit, 
  weight_per_unit, is_active
)
SELECT
  (SELECT id FROM products WHERE slug = 'sugar-kabras-white'),
  'school',
  4200,
  3,
  '50kg Bag',
  50,
  true;
```

### Create Test Admin User

**Step 1: Create auth user in Supabase**
1. Go to Authentication → Users
2. Click "Add user"
3. Email: `admin@canvus.com`
4. Password: `TempPassword123!` (change immediately)
5. Click "Create user"
6. Copy the UUID (from the Users list)

**Step 2: Add to staff_profiles table**
```sql
INSERT INTO public.staff_profiles (
  user_id, email, full_name, role, store_code, is_active
)
VALUES (
  'PASTE_THE_UUID_HERE',  -- From step above
  'admin@canvus.com',
  'Admin User',
  'super_admin',
  'main',
  true
);
```

---

## Verify Everything Works

### From Your App
1. Create `src/app/test/page.tsx`:
```typescript
"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function TestPage() {
  const [status, setStatus] = useState("Testing...");

  useEffect(() => {
    const supabase = getSupabase();
    
    // Test categories
    supabase.from("categories").select("count").single()
      .then(({ data, error }) => {
        if (error) {
          setStatus(`❌ Error: ${error.message}`);
        } else {
          setStatus(`✅ Connected! Database ready!`);
        }
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontSize: '1.2rem' }}>
      <h1>{status}</h1>
    </div>
  );
}
```

2. Run: `npm run dev`
3. Visit: `http://localhost:3000/test`
4. You should see: `✅ Connected! Database ready!`

---

## Quick SQL Commands Reference

### Check Table Row Counts
```sql
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'mpesa_payments', COUNT(*) FROM mpesa_payments;
```

### List All Products with Wholesale Prices
```sql
SELECT 
  p.name,
  p.retail_price,
  wp.tier_level,
  wp.unit_price,
  wp.bulk_unit,
  (p.retail_price * 50 - wp.unit_price) as savings_vs_50_units
FROM products p
LEFT JOIN wholesale_prices wp ON p.id = wp.product_id
WHERE p.is_active = true
ORDER BY p.name, wp.tier_level;
```

### Get All Orders with Customer Names
```sql
SELECT 
  o.order_number,
  o.customer_name,
  o.total_amount,
  o.status,
  o.payment_status,
  COUNT(oi.id) as item_count,
  DATE(o.created_at) as order_date
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 20;
```

### Check M-Pesa Payments Status
```sql
SELECT 
  mp.mpesa_reference,
  mp.customer_phone,
  mp.amount_requested,
  mp.payment_status,
  o.order_number,
  mp.created_at
FROM mpesa_payments mp
LEFT JOIN orders o ON mp.order_id = o.id
ORDER BY mp.created_at DESC
LIMIT 20;
```

### Verify RLS Policies
```sql
SELECT 
  schemaname, tablename, policyname, permissive
FROM pg_policies
ORDER BY tablename;
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot import" | Schema wrong URL | Verify you copied full schema.sql |
| "Column already exists" | Partial import | Drop all tables and retry |
| "Function not found" | Extensions missing | Run `CREATE EXTENSION pg_trgm` |
| "Cannot find order numbers" | Function not created | Run schema again from fresh |
| "RLS blocking queries" | Policies too strict | Check auth.uid() vs user_id |

---

## Backup Before Major Changes

```sql
-- Export table data as SQL INSERT statements
-- In Supabase: click table → click ... → Export data → SQL

-- Or manually backup critical tables:
-- Do not run this unless needed
-- CREATE TABLE products_backup AS SELECT * FROM products;
```

---

## Performance Optimization

After initial setup, run these to optimize:

```sql
-- Analyze query performance
ANALYZE;

-- Rebuild indexes
REINDEX DATABASE postgres;

-- Check index usage
SELECT 
  schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Next: Connect to Your App

Once database is verified:

1. ✅ Update `.env.local` with your anon key
2. ✅ Restart `npm run dev`
3. ✅ Your wholesale portal will now use real Supabase data
4. ✅ Test a sample order flow

---

## Need More Help?

- **Schema questions:** See `DATABASE_SCHEMA_REFERENCE.md`
- **Setup walkthrough:** See `SUPABASE_SETUP.md`
- **Integration guide:** See `CANVUS_INTEGRATION_SUMMARY.md`
- **Supabase docs:** https://supabase.com/docs
- **Next.js integration:** https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

**Database setup is the foundation. Take your time! 🔨**
