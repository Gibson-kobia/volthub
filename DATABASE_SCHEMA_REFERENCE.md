# Canvus Database Schema - Quick Reference

## Table Relationship Diagram

```
auth.users (Supabase built-in)
├── profiles (Customer profiles)
├── staff_profiles (Admin/staff users)
└── product_reviews (User reviews)

categories
└── products
    ├── wholesale_prices (Tiered pricing)
    ├── inventory_tracking (Stock levels)
    ├── inventory_movements (Stock audit log)
    └── order_items (Products in orders)

orders (Customer orders)
├── order_items (Individual items)
├── order_returns (Returns/refunds)
├── mpesa_payments (M-Pesa tracking)
└── user_id → profiles
```

---

## Core Tables

### 1. `profiles` - Customer Accounts
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Links to auth.users |
| email | TEXT | Unique customer email |
| full_name | TEXT | Customer name |
| phone_number | TEXT | Contact phone |
| **account_type** | TEXT | 'retail' \| 'school' \| 'wholesaler' \| 'bulk_buyer' |
| **school_name** | TEXT | If school account |
| **school_code** | TEXT | e.g., "MERU001" |
| **business_name** | TEXT | If wholesaler |
| **business_registration** | TEXT | Business license |
| **tin_number** | TEXT | Tax ID number |
| is_verified | BOOLEAN | Wholesaler verified status |
| is_active | BOOLEAN | Account active/suspended |

### 2. `staff_profiles` - Admin Users
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Staff record ID |
| user_id | UUID | Links to auth.users |
| email | TEXT | Staff email |
| full_name | TEXT | Staff name |
| **role** | TEXT | 'super_admin' \| 'store_admin' \| 'cashier' \| 'rider' |
| store_code | TEXT | 'main' \| 'canvus' (multi-store) |
| is_active | BOOLEAN | Can staff log in |
| permissions | JSONB | Custom granular permissions |

---

## Product Catalog

### 3. `categories` - Product Categories
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Category ID |
| name | TEXT | "Staples", "Oils & Fats", etc. |
| slug | TEXT | URL-friendly: "staples" |
| is_active | BOOLEAN | Show in catalog |
| display_order | INTEGER | Sort order |

### 4. `products` - Retail & Wholesale Products
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Product ID |
| name | TEXT | "Sugar", "Cooking Oil" |
| slug | TEXT | "sugar", "cooking-oil" |
| category_id | UUID | FK → categories.id |
| **retail_price** | NUMERIC | KES per retail unit (e.g., 1kg) |
| **retail_unit** | TEXT | "1kg", "Single", "Pack" |
| **retail_stock** | INTEGER | Units in retail stock |
| image_url | TEXT | Product image |
| sku | TEXT | Unique stock keeping unit |
| barcode | TEXT | Barcode for scanning |
| cost_price | NUMERIC | Wholesale cost |
| reorder_level | INTEGER | Alert when stock below |
| is_active | BOOLEAN | Available for sale |
| is_archived | BOOLEAN | Hidden/discontinued |
| featured | BOOLEAN | Show in featured section |

### 5. `wholesale_prices` - Tiered Pricing
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Price tier ID |
| product_id | UUID | FK → products.id |
| **tier_level** | TEXT | 'tier1' \| 'tier2' \| 'tier3' \| 'school' \| 'bulk_buyer' |
| **unit_price** | NUMERIC | KES per bulk unit |
| **bulk_quantity_min** | INTEGER | Minimum units for this price |
| **bulk_quantity_max** | INTEGER | Maximum (NULL = unlimited) |
| **bulk_unit** | TEXT | "50kg Bag", "Bale of 12", "Carton" |
| **weight_per_unit** | NUMERIC | kg per bulk unit (for delivery) |
| cost_per_bulk_unit | NUMERIC | Supplier cost |
| margin_percent | NUMERIC | Profit margin % |
| valid_from / valid_until | TIMESTAMP | Price validity dates |

**Example: Sugar Wholesale Prices**
```
Product: Sugar
├─ Tier 1 (5+ bags): KES 4,500 per 50kg Bag (Save 25%)
├─ Tier 2 (10+ bags): KES 4,200 per 50kg Bag (Save 30%)
├─ School (3+ bags): KES 4,200 per 50kg Bag (Save 30%)
└─ Bulk Buyer (15+ bags): KES 4,000 per 50kg Bag (Save 33%)
```

---

## Inventory Management

### 6. `inventory_tracking` - Current Stock Levels
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Tracking record |
| product_id | UUID | FK → products.id |
| store_code | TEXT | 'main' or 'canvus' |
| **wholesale_stock** | INTEGER | Bulk units available |
| **retail_stock** | INTEGER | Individual units available |
| **reserved_stock** | INTEGER | Units awaiting pickup |
| reorder_level | INTEGER | When to reorder |
| last_reorder_date | TIMESTAMP | Last purchase date |

### 7. `inventory_movements` - Stock Audit Log
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Movement record |
| product_id | UUID | FK → products.id |
| **movement_type** | TEXT | 'inbound' \| 'sale' \| 'return' \| 'adjustment' \| 'loss' |
| **quantity_change** | INTEGER | +10 or -5 units |
| reference_type | TEXT | 'order', 'purchase', 'adjustment', 'note' |
| reference_id | UUID | Links to source (order ID, etc.) |
| notes | TEXT | "Damaged in transport" |
| created_by | UUID | Staff who made change |
| created_at | TIMESTAMP | When it happened |

**Purpose:** 100% stock accountability. Every change is logged for audit.

---

## Orders & Fulfillment

### 8. `orders` - Order Header
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Order ID |
| **order_number** | TEXT | "ORD-2026-04-21-0001" |
| user_id | UUID | Customer (FK → profiles) |
| customer_name | TEXT | Name (if guest) |
| customer_email | TEXT | Email |
| customer_phone | TEXT | Phone for delivery |
| **customer_type** | TEXT | 'retail' \| 'school' \| 'wholesaler' \| 'bulk_buyer' |
| **status** | ENUM | 'pending' → 'confirmed' → 'preparing' → 'with_rider' → 'delivered' |
| **payment_status** | ENUM | 'pending' → 'paid' (\| 'partially_paid', 'refunded') |
| **payment_method** | ENUM | 'mpesa' \| 'cash' \| 'card' \| 'bank_transfer' |
| subtotal | NUMERIC | KES before delivery/tax |
| delivery_fee | NUMERIC | Shipping cost |
| tax_amount | NUMERIC | VAT |
| **total_amount** | NUMERIC | Final KES amount |
| delivery_method | TEXT | 'pickup' \| 'delivery' |
| delivery_location | JSONB | { latitude, longitude, address } |
| delivery_address_text | TEXT | Delivery instructions |
| rider_id | UUID | Assigned delivery person |
| internal_notes | TEXT | Admin notes |
| created_at | TIMESTAMP | Order placed |
| completed_at | TIMESTAMP | Order delivered |

### 9. `order_items` - Items in Order
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Item line ID |
| order_id | UUID | FK → orders.id |
| product_id | UUID | FK → products.id |
| **product_name** | TEXT | Snapshot (in case product deleted) |
| **quantity** | INTEGER | Number of bulk units |
| **quantity_unit** | TEXT | "50kg Bag", "Carton", "Bale of 12" |
| **unit_price** | NUMERIC | KES per bulk unit |
| line_total | NUMERIC | quantity × unit_price |
| discount_amount | NUMERIC | If bulk discount applied |
| notes | TEXT | "Requested premium grade" |

**Example: Order with 2 items**
```
Order #ORD-2026-04-21-0001
├─ Sugar: 5 × 50kg Bags @ KES 4,500 = KES 22,500
├─ Flour: 3 × 25kg Sacks @ KES 3,200 = KES 9,600
└─ Subtotal: KES 32,100
```

### 10. `mpesa_payments` - M-Pesa & Till Tracking
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Payment record |
| order_id | UUID | FK → orders.id |
| **mpesa_reference** | TEXT | STK Push ref / checkout request ID |
| **customer_phone** | TEXT | Phone number for M-Pesa |
| amount_requested | NUMERIC | KES asked |
| amount_paid | NUMERIC | KES confirmed |
| **payment_status** | ENUM | 'pending' → 'paid' (\| 'failed') |
| **Till / Buy Goods Fields:** | | |
| till_number | TEXT | Your shop's Till # |
| business_short_code | TEXT | Shortcode (e.g., "123456") |
| mpesa_status_code | TEXT | "0" = success, "1" = cancelled |
| mpesa_receipt_number | TEXT | "LHD8892...ABC" |
| transaction_date | TIMESTAMP | When payment was made |
| verified_at | TIMESTAMP | Admin verified payment |
| verified_by | UUID | Admin who verified |

**M-Pesa Flow:**
1. Customer enters phone in checkout
2. STK Push sent → `mpesa_payments.mpesa_reference` recorded
3. Customer enters PIN
4. Payment confirmed → `amount_paid` populated
5. `payment_status: 'paid'`
6. `order.status: 'confirmed'`

### 11. `order_returns` - Returns & Refunds
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Return record |
| order_id | UUID | FK → orders.id |
| **return_number** | TEXT | "RET-2026-04-21-0001" |
| reason | TEXT | "Damaged goods" |
| items | JSONB | [{ product_id, quantity, reason }] |
| **refund_amount** | NUMERIC | KES to refund |
| **refund_method** | TEXT | 'mpesa' \| 'cash' \| 'credit' |
| **refund_status** | TEXT | 'pending' → 'processed' (\| 'failed') |
| status | TEXT | 'requested' → 'approved' (\| 'rejected') |
| approved_by | UUID | Staff who approved |

---

## Customer Engagement

### 12. `product_reviews` - Ratings & Reviews
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Review ID |
| product_id | UUID | FK → products.id |
| user_id | UUID | FK → profiles / auth.users |
| title | TEXT | "Excellent quality" |
| content | TEXT | Full review text |
| rating | INT | 1-5 stars |
| is_verified_purchase | BOOLEAN | Customer bought it |
| is_approved | BOOLEAN | Admin reviewed |
| helpful_count | INT | Thumbs up count |

---

## Key Concepts

### Account Tiers & Wholesale Access

```
┌─────────────────────────────────────────────────────┐
│ RETAIL                                              │
│ - Basic customer account                            │
│ - Retail prices only                                │
│ - No volume discounts                               │
│ - Shop online anytime                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SCHOOL (Verified)                                   │
│ - School with registration document                 │
│ - School-tier wholesale pricing                     │
│ - Bulk order capability (3+ bags minimum)           │
│ - Dedicated account manager                         │
│ - Payment terms negotiable                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ WHOLESALER (Verified)                               │
│ - Business with TIN number & registration           │
│ - Best wholesale pricing (Tier 2-3)                 │
│ - Highest volume discounts                          │
│ - Priority order fulfillment                        │
│ - Potentially credit terms                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ BULK BUYER (Verified)                               │
│ - Large orders (15+ bags)                           │
│ - Special pricing & terms                           │
│ - Direct account manager                            │
│ - Same-day or next-day delivery                     │
└─────────────────────────────────────────────────────┘
```

### Pricing Formula

```
CUSTOMER SAVINGS = (Retail Price × Bulk Quantity) - Wholesale Price

Example: Sugar
  Retail: KES 120 per 1kg
  Customer buys: 5 bags of 50kg (= 250 kg total)
  Retail cost: 120 × 250 = KES 30,000
  Wholesale cost: 5 × KES 4,500 = KES 22,500
  SAVINGS: KES 7,500 (25%)
```

### Order Status Flow

```
New Order
    ↓
Pending (Payment awaited)
    ↓
Confirmed (Payment received)
    ↓
Preparing (Packing items)
    ↓
Ready for Pickup OR With Rider (In transit)
    ↓
Delivered
    ↓
Complete ✓

OR at any point:
    ↓
Cancelled (Refund issued)
```

### Payment Status Flow

```
Pending (Awaiting payment)
    ↓
Partially Paid (Some amount received)
    ↓ OR ↓
Paid (Full amount) / Failed (Declined)
    ↓
Complete

If customer returns:
    ↓
Refunded (Money returned via mpesa/cash/credit)
```

---

## Common Queries

### Get a School's Orders for This Month
```sql
SELECT 
  o.order_number, o.total_amount, o.status, o.created_at
FROM public.orders o
JOIN public.profiles p ON o.user_id = p.id
WHERE p.account_type = 'school' 
  AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())
ORDER BY o.created_at DESC;
```

### Get Wholesale Prices for a Product
```sql
SELECT 
  tier_level, unit_price, bulk_quantity_min, bulk_unit,
  (unit_price / weight_per_unit)::numeric(8,2) as price_per_kg
FROM public.wholesale_prices
WHERE product_id = 'the-product-id'
ORDER BY tier_level;
```

### Get Revenue by Customer Type
```sql
SELECT 
  p.account_type, 
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_revenue
FROM public.orders o
JOIN public.profiles p ON o.user_id = p.id
GROUP BY p.account_type;
```

### Get Stock Audit for a Product
```sql
SELECT 
  movement_type, quantity_change, 
  reference_type, created_by, created_at
FROM public.inventory_movements
WHERE product_id = 'the-product-id'
ORDER BY created_at DESC;
```

### Get Pending M-Pesa Payments
```sql
SELECT 
  mp.*, o.order_number
FROM public.mpesa_payments mp
LEFT JOIN public.orders o ON mp.order_id = o.id
WHERE mp.payment_status = 'pending'
  AND mp.created_at > NOW() - INTERVAL '1 day'
ORDER BY mp.created_at DESC;
```

---

## Row-Level Security (RLS) Overview

| Table | Policy | Who Can Access |
|-------|--------|---|
| `profiles` | Self-read/write | Own profile only |
| `categories` | Public read | Everyone (active only) |
| `products` | Public read | Everyone (active only) |
| `staff_profiles` | Super admin only | super_admin role |
| `orders` | User's own + admin | Own orders + staff per role |
| `order_items` | Inherit from orders | User's orders + staff |
| `mpesa_payments` | User's own + admin | Own payments + staff |

**Note:** All RLS policies are already implemented in schema.sql

---

## Performance Indexes

All tables have indexes on:
- Foreign keys (lookups)
- Frequently searched fields (name, slug, email)
- Timestamp columns (for date-range queries)
- Enum/status fields (filtering)
- Full-text search on product names (using gin_trgm)

---

## Backup & Disaster Recovery

Recommended Supabase settings:
- ✅ Enable PITR (Point-in-Time Recovery)
- ✅ Set up automated daily backups
- ✅ Keep 30-day backup retention
- ✅ Test restore procedure monthly

---

## Update & Trigger Functions

The schema includes:
1. `generate_order_number()` - Auto-generates order numbers
2. `update_product_rating()` - Re-calculates avg_rating when reviews change
3. `update_timestamp()` - Auto-updates `updated_at` on changes

---

## Next: Integration Checklist

- [ ] Supabase schema imported
- [ ] Test data added (categories, products, prices)
- [ ] Admin user created in staff_profiles
- [ ] Environment variables configured
- [ ] Connection test passed
- [ ] RLS policies understood
- [ ] M-Pesa integration planned
- [ ] Order fulfillment workflow designed
- [ ] Return/refund process documented

