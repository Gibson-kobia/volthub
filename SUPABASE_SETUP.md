# Canvus Supabase Setup Guide

## Overview
This guide walks you through connecting your Canvus e-commerce platform to Supabase and setting up the database schema.

---

## Step 1: Environment Configuration

### Files Created
- `.env.example` - Template for all environment variables
- `.env.local` - Local development configuration (NEVER commit to git)

### Actions Required

1. **Copy the template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Supabase API keys:**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to **Settings → API**
   - Copy the values:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Update `.env.local`:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://vuqgtesyiacniirsfaem.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Keep `.env.local` secret:**
   ```bash
   # Verify .env.local is in .gitignore
   cat .gitignore | grep ".env.local"
   ```

### Optional: Server-Side Operations
If you need to perform server-side database operations (admin tasks, batch processing):

1. Get your **Service Role Key** from Supabase Settings → API
2. Add to `.env.local` (NEVER in `.env.example`):
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

---

## Step 2: client Initialization (Already Configured)

The file `src/lib/supabase.ts` is already set up for you with:

### Client-Side Setup
```typescript
import { getSupabase } from "@/lib/supabase";

export default function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const supabase = getSupabase();
    supabase
      .from('products')
      .select('*')
      .then(({ data }) => setData(data));
  }, []);
  
  return <div>{/* render data */}</div>;
}
```

### Server-Side Setup (for API routes)
```typescript
import { createServerClient } from "@/lib/supabase";

export async function GET(request) {
  const supabase = createServerClient();
  const { data } = await supabase.from('staff_profiles').select('*');
  return Response.json(data);
}
```

---

## Step 3: Database Schema Setup

### What's Included in `supabase/schema.sql`

The schema covers **5 major areas**:

#### 1. **Authentication & Profiles** 
- `profiles` - Extended user information (schools, wholesalers, retailers)
- `staff_profiles` - Admin users with roles (super_admin, store_admin, cashier, rider)

#### 2. **Product Catalog**
- `categories` - Product categories (Staples, Oils, Beverages, etc.)
- `products` - Main product table with SKU, barcode, pricing
- `wholesale_prices` - Tiered wholesale pricing (Tier 1/2/3, School, Bulk Buyer)
- `inventory_tracking` - Stock levels per location
- `inventory_movements` - Audit log of all stock changes

#### 3. **Orders & Payments**
- `orders` - Order header (customer, totals, status)
- `order_items` - Individual items in each order
- `mpesa_payments` - M-Pesa STK Push tracking with Till/Buy Goods support
- `order_returns` - Return/refund processing

#### 4. **Customer Features**
- `product_reviews` - Ratings and reviews

#### 5. **Security**
- Row-Level Security (RLS) policies
- Role-based access control

### Import the Schema

1. **Go to Supabase SQL Editor:**
   - https://app.supabase.com → Your Project → SQL Editor

2. **Create a new query:**
   - Click "New Query"
   - Paste the entire contents of `supabase/schema.sql`
   - Click "Run" (execute button)

3. **Wait for completion:**
   - You'll see a success message once all tables are created
   - Check the schema in the Table Editor on the left

### Verify Tables Were Created
You should see these tables in your Supabase dashboard:
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

## Step 4: Test the Connection

### From Your App

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Test in a client component:**
   Create `src/app/test/page.tsx`:
   ```typescript
   "use client";
   import { useEffect, useState } from "react";
   import { getSupabase } from "@/lib/supabase";

   export default function TestPage() {
     const [status, setStatus] = useState("Loading...");

     useEffect(() => {
       const supabase = getSupabase();
       supabase.from("categories").select("*").then(({ data, error }) => {
         if (error) {
           setStatus(`❌ Error: ${error.message}`);
         } else {
           setStatus(`✅ Connected! Found ${data?.length || 0} categories`);
         }
       });
     }, []);

     return <div className="p-8"><h1>{status}</h1></div>;
   }
   ```

3. **Visit http://localhost:3000/test**
   - You should see: `✅ Connected! Found X categories`

---

## Step 5: Understanding the Schema

### User Roles & Access Control

#### Retail Customer
- Creates account as `account_type: 'retail'`
- Can browse products at retail prices
- Places orders

#### School Account
- Registers with `school_name` and `school_code`
- `account_type: 'school'`
- Accesses school-tier wholesale prices
- Required for bulk ordering

#### Wholesaler / Bulk Buyer
- Business registration required (`business_registration`, `tin_number`)
- `account_type: 'wholesaler'` or `'bulk_buyer'`
- Access to best wholesale pricing

#### Admin Staff
- Created in `staff_profiles` table
- Role determines access:
  - `super_admin` - Full system access
  - `store_admin` - Products, inventory, orders, reports
  - `cashier` - POS and order management
  - `rider` - Delivery queue only

### Wholesale Pricing Logic

#### Example: Sugar Product
```
Product: "Sugar"
Retail Price: KES 120 per 1kg
Retail Stock: 500 kg

Wholesale Prices:
├─ Tier 1 (min 5 bags): KES 4,500 per 50kg Bag
├─ School (min 3 bags): KES 4,200 per 50kg Bag
└─ Bulk Buyer (min 10 bags): KES 4,000 per 50kg Bag
```

**Calculation:**
- Retail cost: 120 × 50 = KES 6,000
- Wholesale: KES 4,500
- Customer Saves: KES 1,500 (25% off)

### Order Flow

1. **Customer places order** → `orders` table created
2. **System reserves inventory** → `inventory_tracking.reserved_stock` updated
3. **Payment initiated** → `mpesa_payments` record created
4. **Payment confirmed** → `order_status: 'confirmed'`
5. **Order prepared** → `order_status: 'preparing'`
6. **Delivery/Pickup** → `order_status: 'with_rider'` or `'ready_for_pickup'`
7. **Complete** → `order_status: 'delivered'`
8. **Stock deducted** → `inventory_movements` log created

### M-Pesa Integration (mpesa_payments table)

Fields for Till/Buy Goods:
- `merchant_request_id` - STK Push reference
- `till_number` - Your shop's Till number
- `business_short_code` - Shortcode for payments
- `mpesa_status_code` - "0" = success, "1" = cancelled
- `mpesa_receipt_number` - Confirmation number
- `transaction_date` - When payment was made

---

## Step 6: Customization

### Add Sample Products

In the Supabase SQL Editor:

```sql
INSERT INTO public.products (
  name, slug, description, category_id, retail_price, retail_unit,
  image_url, retail_stock, sku, is_active
)
SELECT
  'Sugar',
  'sugar',
  'Kabras White Sugar',
  (SELECT id FROM categories WHERE slug = 'staples'),
  120,
  '1kg',
  '/images/sugar.jpg',
  500,
  'SUGAR-001',
  true;
```

### Add Wholesale Pricing

```sql
INSERT INTO public.wholesale_prices (
  product_id, tier_level, unit_price, bulk_quantity_min,
  bulk_unit, weight_per_unit, is_active
)
SELECT
  (SELECT id FROM products WHERE slug = 'sugar'),
  'tier1',
  4500,
  5,
  '50kg Bag',
  50,
  true;
```

### Create an Admin User

1. **Create auth user in Supabase:**
   - Go to Authentication → Users
   - Add user manually with email/password

2. **Add to staff_profiles:**
   ```sql
   INSERT INTO public.staff_profiles (
     user_id, email, full_name, role, is_active
   )
   VALUES (
     'the-uuid-of-the-user',
     'admin@canvus.com',
     'Admin Name',
     'super_admin',
     true
   );
   ```

---

## Step 7: Security Best Practices

### 1. Environment Variables
- ✅ Commit: `.env.example`
- ❌ Never commit: `.env.local`
- ❌ Never commit: Any file with real keys

### 2. API Keys
- `NEXT_PUBLIC_SUPABASE_URL` - Public (exposed in browser)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public (safe for browser)
- `SUPABASE_SERVICE_ROLE_KEY` - Private (server-side only)

### 3. RLS Policies
- All tables have RLS enabled
- Users can only see their own data
- Admins can see what their role permits
- Anonymous users see only public products

### 4. Production Checklist
- [ ] Remove sample data from schema.sql
- [ ] Set up automated backups
- [ ] Enable PITR (Point-in-Time Recovery)
- [ ] Monitor RLS policies
- [ ] Set up database roles for different apps
- [ ] Test all user roles in staging

---

## Step 8: Troubleshooting

### "Supabase environment variables are missing"
**Fix:**
1. Check `.env.local` exists and has both keys
2. Restart dev server: `npm run dev`
3. Verify keys in Supabase Settings → API

### "RLS policy violation"
**Fix:**
1. Check user role in `staff_profiles` table
2. Verify RLS policy allows the operation
3. Check if user is authenticated

### Connection timeout
**Fix:**
1. Verify Supabase project is active
2. Check internet connection
3. Check if Supabase is under maintenance

### Schema import failed
**Fix:**
1. Clear SQL editor and try smaller sections
2. Check for syntax errors (quotation marks, commas)
3. Try importing migrations from `supabase/migrations/` first

---

## Next Steps

1. ✅ Copy env template and set up `.env.local`
2. ✅ Import `supabase/schema.sql` into Supabase
3. ✅ Add sample products and prices
4. ✅ Create admin users
5. ✅ Test connection with the test page
6. **→ Integrate with your Next.js pages (checkout, wholesale portal, admin)**
7. **→ Implement M-Pesa payment callbacks**
8. **→ Set up order fulfillment workflow**

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Supabase Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row-Level Security (RLS)](https://supabase.com/docs/guide/auth#row-level-security)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke/docs)

