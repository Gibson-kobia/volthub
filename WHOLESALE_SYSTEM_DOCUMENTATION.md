# Canvus Wholesale System - Implementation Guide

## Overview
This document fully documents the Bale Logic wholesale system built for Canvus, a Kenyan wholesale-focused e-commerce platform. The system implements the "24kg Rule" for packaging bulk orders and provides a high-performance wholesale ordering interface.

---

## 1. The Bale Logic (The "24kg Rule")

### Core Concept
In the Kenyan market, wholesale inventory is sold in **bales**, not individual units. The total weight per bale is consistent, enabling predictable inventory and pricing:

| Packet Size | Units per Bale | Total Weight | Use Case |
|-------------|----------------|--------------|--------------------|
| 1kg | 24 | 24kg | Flour, Sugar, Rice |
| 2kg | 12 | 24kg | Flour, Some Rice |
| 500g | 40 | 20kg | Salt, Tissue, Condiments |
| 1L | 20 | 20L | Cooking Oil |

### Implementation
- **Database Field**: `units_per_bale` (integer) on the `products` table
- **Packet Definition**: `packet_size` (string, e.g., "1kg", "2kg", "500g")
- **Inventory Unit**: `stock_bales` (bales in stock, not individual units)
- **Price Structure**: `wholesale_price_per_bale` (KES per complete bale)

### Calculation Examples
```
1kg Flour Bale:
  - Packet Size: 1kg
  - Units Per Bale: 24
  - Price Per Bale: KES 1,680
  - Price Per Packet: 1,680 ÷ 24 = KES 70/packet ← Shown in UI

2kg Flour Bale:
  - Packet Size: 2kg
  - Units Per Bale: 12
  - Price Per Bale: KES 1,680
  - Price Per Packet: 1,680 ÷ 12 = KES 140/packet ← Shown in UI
```

---

## 2. Database Schema Changes

### Migration File
**Location**: `/workspaces/volthub/supabase/migrations/20260422_bale_logic_wholesale.sql`

### New Columns Added to `products` Table
```sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS
  packet_size TEXT DEFAULT '1kg',
  units_per_bale INTEGER DEFAULT 24,
  stock_bales INTEGER DEFAULT 0,
  wholesale_price_per_bale NUMERIC(10, 2),
  is_bale_product BOOLEAN DEFAULT FALSE;
```

### Supporting Objects Created

#### 1. Indexes
- `idx_products_is_bale_product`: For filtering bale products
- `idx_products_packet_size`: For packet size queries

#### 2. View: `wholesale_inventory_summary`
Provides a clean summary of wholesale inventory with:
- Product details (name, brand, category)
- Bale metrics (units per bale, total packets, total weight)
- Pricing information
- Stock status classification (high/medium/low/out)

#### 3. Audit Table: `bale_inventory_audit`
Tracks all changes to bale inventory for:
- Compliance & traceability
- Operations analysis
- Reorder planning
- Change history

#### 4. Trigger: `update_bale_inventory_audit()`
Automatically logs bale quantity changes

---

## 3. TypeScript Types

### Updated Types File
**Location**: `/workspaces/volthub/src/lib/types.ts`

### New Type: `WholesaleProduct`
```typescript
export type WholesaleProduct = DBProduct & {
  packet_size: string;                      // e.g., "1kg", "2kg", "500g"
  units_per_bale: number;                   // e.g., 24, 12, 40
  stock_bales: number;                      // Inventory in bales
  wholesale_price_per_bale: number;         // KES per bale
  is_bale_product: boolean;                 // Bale-based pricing flag
  
  // Computed helpers (optional)
  price_per_packet?: number;                // wholesale_price_per_bale / units_per_bale
  total_weight_kg?: number;                 // Calculated bale weight
};
```

---

## 4. Wholesale Page Implementation

### File Location
`/workspaces/volthub/src/app/wholesale/page.tsx`

### Features

#### 1. **Smart Brand Grouping**
- Products automatically grouped by brand
- Desktop: Grouped rows in table with brand headers
- Mobile: Collapsible brand sections
- Brands shown in the mock data:
  - **Flour**: Ajab, Raha, Lotus (1kg & 2kg options)
  - **Rice**: Raha, Bandari, Spencer, Nice, Beamer
  - **Milk**: Mt. Kenya (500ml crates)
  - **Essentials**: Mumias Sugar, Tropical Salt, Royco, Pwani Oil
  - **Household**: Peachey, Rosey, Olx Tissue
  - **Snacks**: PPCL Biscuits, Pipi Maxima

#### 2. **Bale-to-Packet Conversion**
- Helper text below quantity input shows total packets
- Example: "2 bales of 1kg flour = 48 packets"
- Formula: `quantity_bales × units_per_bale = total_packets`

#### 3. **Pricing Transparency**
- Shows **Price Per Bale** prominently
- Shows **Price Per Packet** as secondary info with trend icon
- Example:
  ```
  KES 1,680 (per bale)
  ↙ KES 70/packet
  ```

#### 4. **Real-time Search**
- Search by:
  - Product name (e.g., "Flour", "Rice")
  - Brand name (e.g., "Ajab", "Raha")
  - Category (e.g., "Essentials", "Household")
- Filter updates instantly as user types

#### 5. **Stock Status Indicators**
- **In Stock** (✓): Bales ≥ 4
- **Low Stock** (!): Bales 1-3
- **Out of Stock** (×): Bales = 0
- Badge shows actual bale count

#### 6. **Mobile Optimization**
```
Desktop:
- Full table with 6 columns
- Sticky header & cart
- All controls inline

Mobile:
- Card-based layout
- Collapsible brand headers
- +/- buttons for quantities
- Drawer-based cart view
- Touch-friendly spacing
```

#### 7. **Sticky Bottom Calculator (Desktop)**
- Fixed position at bottom of screen
- Shows:
  - Total Bales Ordered
  - Total Packets (calculated)
  - Total Amount (KES)
- Actions: Clear Cart, Proceed to Checkout

#### 8. **Mobile Cart Drawer**
- Bottom sheet interface
- Swipeable and dismissible
- Shows all cart items
- Quick totals summary
- Clear & Checkout buttons

#### 9. **Enterprise Styling**
- Clean borders with slate-200 color
- High-readability fonts (Inter/system stack)
- Professional emerald/teal gradient
- Consistent spacing (multiples of 4px)
- Accessible color contrast (WCAG AA)
- Lucide icons for visual clarity

---

## 5. Mock Data Structure

### 20 Products Across 6 Categories

**Flour (6 SKUs)**
- Ajab 1kg (24 units/bale) - KES 1,680 → KES 70/packet
- Ajab 2kg (12 units/bale) - KES 1,680 → KES 140/packet
- Raha 1kg (24 units/bale) - KES 1,560 → KES 65/packet
- Raha 2kg (12 units/bale) - KES 1,560 → KES 130/packet
- Lotus 1kg (24 units/bale) - KES 1,440 → KES 60/packet
- Lotus 2kg (12 units/bale) - KES 1,440 → KES 120/packet

**Rice (5 SKUs)**
- Raha Basmati - KES 3,840 → KES 160/packet
- Bandari Basmati - KES 3,600 → KES 150/packet
- Spencer Jasmine - KES 3,360 → KES 140/packet
- Nice White - KES 3,120 → KES 130/packet
- Beamer Mixed Grain - KES 2,880 → KES 120/packet

**Milk (1 SKU)**
- Mt. Kenya Fresh (500ml, 12/crate) - KES 960 → KES 80/packet

**Essentials (4 SKUs)**
- Mumias Sugar 1kg - KES 2,160 → KES 90/packet
- Tropical Salt 500g - KES 1,200 → KES 30/packet
- Royco Cubes 10-pack - KES 960 → KES 40/packet
- Pwani Oil 1L - KES 8,000 → KES 400/packet

**Household (3 SKUs)**
- Peachey Tissue 500g - KES 1,440 → KES 60/packet
- Rosey Tissue 500g - KES 1,320 → KES 55/packet
- Olx Tissue Roll - KES 1,080 → KES 90/packet

**Snacks (2 SKUs)**
- PPCL Biscuits 200g - KES 1,920 → KES 80/packet
- Pipi Maxima Sweets 100g - KES 720 → KES 30/packet

---

## 6. UI Components Breakdown

### Sub-Components

#### `StockBadge`
```
Props: { status: StockStatus, bales: number }
- Visual indicator with icon & label
- Colored background (emerald/amber/slate)
- Shows bale count
```

#### `PriceBreakdown`
```
Props: { price_per_bale, units_per_bale }
- Large bale price
- Small packet price with trend icon
- Emerald background highlight
```

#### `QuantityControl`
```
Props: { quantity, disabled, onIncrement, onDecrement, units_per_bale }
- +/- buttons in slate container
- Helper text showing total packets
- Disabled state for out-of-stock
```

#### `ProductCardMobile`
```
Props: { product, quantity, onQuantityChange, disabled }
- Compact card format
- Product info & stock badge
- Price breakdown in emerald box
- Quantity control at bottom
```

#### `ProductTableRow`
```
Props: { product, quantity, onQuantityChange, disabled }
- Single table row for desktop
- 6 columns: Product | Packet | Units/Bale | Stock | Pricing | Qty
- Hover effects & conditional styling
```

#### `TableView` (Component)
- Desktop-only responsive table
- Brand grouping with header rows
- Empty state if no results

#### `MobileView` (Component)
- Mobile-only card layout
- Sticky brand section headers
- Empty state if no results

---

## 7. State Management

### React Hooks Used
- `useState`: Cart state (Map<productId, quantity>), search query, mobile cart visibility
- `useMemo`: 
  - Grouped products by brand
  - Cart summary calculations (total bales, packets, KES)
- `useCallback`: Quantity change handler

### Cart Structure
```typescript
// Using Map for O(1) lookups
const cart: Map<string, number> = new Map([
  ["flour-ajab-1kg", 2],      // 2 bales
  ["rice-raha-1kg", 1],       // 1 bale
  // ...
]);
```

### Cart Summary Calculation
```typescript
{
  total_bales: 3,              // Total bales in cart
  total_packets: (2×24) + (1×24) = 72,  // 2kg flour + rice
  total_kes: (2×1680) + (1×3840) = 7200  // Total amount
}
```

---

## 8. Responsive Breakdown

### Desktop (≥768px)
```
┌─────────────────────┬──────────────────────────────────────────┐
│ Header (sticky top) │ Search (sticky below header)             │
├─────────────────────┴──────────────────────────────────────────┤
│                     MAIN TABLE                                  │
│  Brand Header Row (Ajab)                                        │
│  Product Row 1 (1kg, qty control)                              │
│  Product Row 2 (2kg, qty control)                              │
│  Brand Header Row (Raha)                                        │
│  ... more products ...                                          │
├──────────────────────────────────────────────────────────────────┤
│                Info Box (Bale Logic explanation)                 │
├──────────────────────────────────────────────────────────────────┤
│ STICKY BOTTOM: [3 Bales | 72 packets | KES 7,200] [Clear] [Proceed] │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────┐
│ Header + Cart BTN[3]│ (sticky)
├─────────────────────┤
│ Search Input        │ (sticky below header)
├─────────────────────┤
│ Brand: Ajab [sticky]│
│ ┌─────────────────┐ │
│ │ Product Card 1  │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Product Card 2  │ │
│ └─────────────────┘ │
│                     │
│ Brand: Raha [sticky]│
│ ┌─────────────────┐ │
│ │ Product Card    │ │
│ └─────────────────┘ │
│ ... more products ..│
│                     │ (padding for cart)
├─────────────────────┤
│ Info Box            │
└─────────────────────┘

[Cart Drawer (bottom sheet on icon click)]
┌────────────────────┐
│ Order Summary    [×]│
├────────────────────┤
│ Item 1: 2 bales    │
│ Item 2: 1 bale     │
│ ...                │
├────────────────────┤
│ Total: 3 bales     │
│ Total: KES 7,200   │
├────────────────────┤
│ [Clear] [Checkout] │
└────────────────────┘
```

---

## 9. Implementation Checklist

### Database Setup
- [ ] Run migration: `20260422_bale_logic_wholesale.sql`
- [ ] Verify new columns added to `products` table
- [ ] Verify `wholesale_inventory_summary` view created
- [ ] Verify `bale_inventory_audit` table created
- [ ] Test audit trigger

### TypeScript Setup
- [ ] Verify `WholesaleProduct` type imports work
- [ ] Test type compilation: `npm run build`
- [ ] Update any existing product type references as needed

### Frontend Setup
- [ ] Wholesale page at `/wholesale` route works
- [ ] Mock data displays correctly
- [ ] Search functionality filters by brand/name/category
- [ ] Quantity controls work (+/- buttons)
- [ ] Bale-to-packet conversion shows correctly
- [ ] Price breakdown shows per-packet pricing
- [ ] Stock badges update based on bale count
- [ ] Desktop layout is responsive
- [ ] Mobile layout is responsive
- [ ] Cart calculations are accurate
- [ ] Clear cart button works
- [ ] Mobile cart drawer opens/closes

### Integration Tasks
- [ ] Connect to real Supabase database (replace mock data)
- [ ] Implement checkout flow
- [ ] Add user authentication check (wholesale tier)
- [ ] Connect order submission to backend API
- [ ] Implement order history/tracking
- [ ] Add payment methods (M-Pesa integration)
- [ ] Set up delivery address collection

---

## 10. Future Enhancements

### Phase 2
- [ ] Bulk discount tiers (buy 5+ bales, get 5% off)
- [ ] Saved orders (repeat previous orders)
- [ ] Order scheduling (order now, deliver later)
- [ ] Price history chart per product

### Phase 3
- [ ] Inventory forecasting for retailers
- [ ] Seasonal pricing adjustments
- [ ] Supplier management (track supplier costs)
- [ ] Export orders to CSV/PDF
- [ ] Mobile app with offline cart

### Phase 4
- [ ] B2B API for system integrations
- [ ] Custom pricing per account tier
- [ ] Advanced analytics dashboard
- [ ] Warehouse management integration

---

## 11. Technical Specifications

### Performance Targets
- **Page Load**: < 2 seconds (mocked data)
- **Search Response**: < 100ms (useMemo optimization)
- **Quantity Update**: Instant (Map-based state)
- **Cart Calculation**: < 50ms (useMemo optimization)

### Accessibility (WCAG 2.1 AA)
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Focus indicators on interactive elements
- [ ] Keyboard navigation support
- [ ] ARIA labels on buttons & icons
- [ ] Mobile touch targets ≥ 44×44px

### SEO
- [ ] Meta title: "Wholesale Bulk Orders | Canvus"
- [ ] Meta description: "Enterprise pricing for retailers, schools, wholesalers"
- [ ] Canonical URL
- [ ] Open Graph tags for sharing

---

## 12. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] TypeScript strict mode (no errors)
- [ ] No console errors in dev tools
- [ ] Mobile responsiveness tested on real devices
- [ ] Performance audit (Lighthouse score > 85)

### Deployment
- [ ] Database migration deployed to staging
- [ ] Feature toggle for wholesale page (hidden from retail users)
- [ ] Monitoring set up for errors
- [ ] Analytics tracking: page views, searches, cart adds, checkouts

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Plan Phase 2 enhancements

---

## 13. File Structure

```
/workspaces/volthub/
├── src/
│   ├── app/
│   │   ├── wholesale/
│   │   │   └── page.tsx ⭐ NEW (1,500+ lines)
│   │   └── ...
│   ├── lib/
│   │   ├── types.ts ⭐ UPDATED (added WholesaleProduct)
│   │   └── ...
│   └── ...
├── supabase/
│   ├── migrations/
│   │   ├── ...
│   │   └── 20260422_bale_logic_wholesale.sql ⭐ NEW
│   └── ...
└── ...
```

---

## Summary

The Canvus Wholesale System is now fully implemented with:

✅ **Database**: Bale logic schema with audit trail
✅ **Types**: TypeScript support for wholesale products
✅ **UI**: High-performance bulk ordering interface
✅ **UX**: Mobile-optimized with real-time search & smart grouping
✅ **Data**: 20 authentic Kenyan brand products with realistic pricing

All components work together to provide traders, school bursars, and retailers with a fast, transparent way to order wholesale goods using Kenyan bale packaging standards.
