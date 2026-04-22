# Canvus Wholesale System - Architecture & Workflow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CANVUS WHOLESALE SYSTEM                         │
│                         ( Kenyan Bale Logic )                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ DATABASE LAYER (Supabase PostgreSQL)                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─── Products Table (Extended) ────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  OLD COLUMNS:                  NEW COLUMNS (Bale Logic):         │   │
│  │  ├─ id                         ├─ packet_size: "1kg"             │   │
│  │  ├─ name: "Wheat Flour"        ├─ units_per_bale: 24            │   │
│  │  ├─ brand: "Ajab"              ├─ stock_bales: 45               │   │
│  │  ├─ category: "Flour"          ├─ wholesale_price_per_bale: 1680│   │
│  │  ├─ retail_price               └─ is_bale_product: true         │   │
│  │  └─ ...                                                           │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─── Audit Trail ───────────────────────────────────────────────────┐  │
│  │  bale_inventory_audit table tracks all bale quantity changes     │  │
│  │  └─ Trigger: update_bale_inventory_audit()                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─── Helper View ────────────────────────────────────────────────────┐  │
│  │  wholesale_inventory_summary (computed view)                      │  │
│  │  ├─ Product & pricing info                                        │  │
│  │  ├─ Total weight in kg                                            │  │
│  │  ├─ Stock status (high/medium/low/out)                           │  │
│  │  └─ Used for reports & dashboard                                 │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

                                    ↑↓ GraphQL

┌──────────────────────────────────────────────────────────────────────────┐
│ FRONTEND APPLICATION LAYER (Next.js React)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────── src/lib/types.ts ─────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  export type WholesaleProduct = DBProduct & {                    │   │
│  │    packet_size: "1kg" | "2kg" | "500g"                          │   │
│  │    units_per_bale: 24 | 12 | 40                                 │   │
│  │    stock_bales: number                                           │   │
│  │    wholesale_price_per_bale: number                              │   │
│  │    is_bale_product: boolean                                      │   │
│  │    price_per_packet?: number  // computed                        │   │
│  │  }                                                                │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────── src/app/wholesale/page.tsx ───────────────────────────────┐   │
│  │                                                                    │   │
│  │  Main Component:                                                 │   │
│  │  ├─ Header [sticky]                                              │   │
│  │  ├─ Search Bar [sticky]                                          │   │
│  │  ├─ TableView [desktop only]                                     │   │
│  │  │  ├─ Brand Header Rows                                         │   │
│  │  │  └─ ProductTableRow × N                                       │   │
│  │  ├─ MobileView [mobile only]                                     │   │
│  │  │  ├─ Brand Sections [sticky headers]                           │   │
│  │  │  └─ ProductCardMobile × N                                     │   │
│  │  ├─ Sticky Bottom Cart [desktop]                                 │   │
│  │  └─ Mobile Cart Drawer [mobile]                                  │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

                                    ↑↓ User Interaction

┌──────────────────────────────────────────────────────────────────────────┐
│ STATE MANAGEMENT (React Hooks)                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  useState:                                                               │
│  ├─ searchQuery: string                                                 │
│  ├─ cart: Map<productId, quantity>                                     │
│  └─ showMobileCart: boolean                                            │
│                                                                            │
│  useMemo:                                                                │
│  ├─ groupedByBrand: Map<brand, products[]>  [depends: searchQuery]   │
│  └─ cartSummary: { total_bales, total_packets, total_kes }            │
│                                                                            │
│  useCallback:                                                            │
│  └─ handleQuantityChange: (id, qty) => void                           │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
USER INTERACTIONS
├─ Search Input
│  └─ setSearchQuery(value)
│     └─ useMemo recalculates groupedByBrand
│        └─ ProductTableRow / ProductCardMobile re-render
│
├─ Quantity Change (+/− buttons)
│  └─ handleQuantityChange(productId, newQty)
│     └─ setCart(new Map)
│        ├─ Cart UI updates
│        └─ useMemo recalculates cartSummary
│           └─ Totals display updates
│
└─ Checkout Button
   └─ handleCheckout(cart)
      └─ [Future: Send to backend]
```

---

## Bale Logic Calculation Flow

```
PRODUCT DATA
│
├─ packet_size: "1kg"
├─ units_per_bale: 24
├─ wholesale_price_per_bale: 1,680 KES
├─ stock_bales: 45
│
USER ENTERS QUANTITY
│
├─ quantity_bales: 2 (user types 2)
│  │
│  └─→ CALCULATIONS
│      ├─ total_packets = 2 × 24 = 48 packets ← UI helper text
│      ├─ total_weight = 48 × 1kg = 48kg ← Informational
│      ├─ price_per_packet = 1,680 ÷ 24 = 70 KES ← UI display
│      └─ line_total = 2 × 1,680 = 3,360 KES ← Order total
│
└─→ DISPLAY TO USER
   ├─ "2 bales selected"
   ├─ "48 packets total" ← Helper text
   ├─ "KES 1,680 per bale  /  KES 70 per packet" ← Pricing
   └─ "Line total: KES 3,360" ← Added to cart
```

---

## User Workflows

### Desktop User Workflow
```
START: User visits /wholesale
  ↓
SEES: Sticky header + Search + Large data table
  ↓
SEARCHES: Types "Ajab" in search
  ↓
FILTERED: Table shows only Ajab products grouped
  ├─ 1kg × 24 (KES 1,680 → KES 70/packet)
  └─ 2kg × 12 (KES 1,680 → KES 140/packet)
  ↓
ADDS TO CART: Clicks +3 times for 3 bales of 1kg
  ↓
SEES: Sticky bottom bar updates:
  "3 Bales | 72 packets | KES 5,040"
  ↓
CLEARS: Clicks "Clear Cart" or continues shopping
  ↓
PROCEEDS: Clicks "Checkout" → [Next page]
```

### Mobile User Workflow
```
START: User visits /wholesale on phone
  ↓
SEES: Header with [search] and [cart button]
  ↓
SEARCHES: Taps search, types "Raha"
  ↓
SCROLLS: Sees collapsible sections for each brand
  ├─ Raha [sticky section header]
  │  ├─ Card: 1kg Flour
  │  │  [+] [-] Qty control
  │  ├─ Card: 2kg Flour
  │  │  [+] [-] Qty control
  │  └─ ...
  └─ Other brands
  ↓
ADDS ITEMS: Taps [+] button to add bales
  ↓
CHECKS CART: Taps [3] badge on cart button
  ↓
SEES DRAWER: Bottom sheet slides up showing:
  ├─ Item 1: 2 bales (Raha 1kg)
  ├─ Item 2: 1 bale (Lotus 2kg)
  ├─ Total: 3 bales
  ├─ Total: KES 7,200
  └─ [Clear] [Checkout]
  ↓
PROCEEDS: Taps Checkout
```

---

## Component Hierarchy

```
WholesalePage (899 lines)
│
├─ Imports
│  ├─ React hooks (useState, useMemo, useCallback)
│  ├─ Lucide icons
│  └─ TypeScript types
│
├─ Type Definitions
│  ├─ WholesaleProduct
│  ├─ CartItem
│  ├─ StockStatus
│  └─ Helper functions
│
├─ Mock Data
│  └─ WHOLESALE_PRODUCTS_MOCK (20 products)
│     ├─ Flour (6 SKUs)
│     ├─ Rice (5 SKUs)
│     ├─ Milk (1 SKU)
│     ├─ Essentials (4 SKUs)
│     ├─ Household (3 SKUs)
│     └─ Snacks (2 SKUs)
│
├─ Sub-Components (defined inside main component)
│  ├─ StockBadge
│  │  └─ Props: { status, bales }
│  │
│  ├─ PriceBreakdown
│  │  └─ Props: { price_per_bale, units_per_bale }
│  │
│  ├─ QuantityControl
│  │  └─ Props: { quantity, disabled, onIncrement, onDecrement, units_per_bale }
│  │
│  ├─ ProductCardMobile
│  │  └─ Props: { product, quantity, onQuantityChange, disabled }
│  │
│  ├─ ProductTableRow
│  │  └─ Props: { product, quantity, onQuantityChange, disabled }
│  │
│  ├─ TableView (returns JSX)
│  │  └─ Desktop table with brand grouping
│  │
│  └─ MobileView (returns JSX)
│     └─ Mobile cards with collapsible brands
│
├─ Main Hooks
│  ├─ useState(searchQuery)
│  ├─ useState(cart: Map)
│  ├─ useState(showMobileCart)
│  ├─ useMemo(groupedByBrand)
│  ├─ useMemo(cartSummary)
│  └─ useCallback(handleQuantityChange)
│
├─ JSX Structure
│  ├─ Sticky Header (logo, title, cart button)
│  ├─ Sticky Search Bar
│  ├─ Main Content
│  │  ├─ <TableView /> (desktop)
│  │  ├─ <MobileView /> (mobile)
│  │  └─ Info Box
│  ├─ Sticky Bottom Cart (desktop)
│  └─ Mobile Cart Drawer
│
└─ Export
   └─ export default WholesalePage
```

---

## Responsive Breakpoints

```
MOBILE (< 640px)
├─ Display: Block (full width)
├─ Header height: Full
├─ Layout: Single column
├─ Table: Hidden (display: none)
├─ Cards: Visible, full width
├─ Cart: Drawer (bottom sheet)
└─ Controls: Touch-friendly (44px min)

TABLET (640px - 1024px)
├─ Display: Block (wider)
├─ Header height: Auto
├─ Layout: Single column
├─ Table: Hidden or responsive
├─ Cards: Visible, 2 columns possible
├─ Cart: Hybrid (drawer or bottom bar)
└─ Controls: Mix of touch & hover

DESKTOP (> 1024px)
├─ Display: Grid possible
├─ Header height: Auto
├─ Layout: Can be 2+ columns
├─ Table: Visible, full featured (6 columns)
├─ Cards: Hidden (display: none)
├─ Cart: Sticky bottom bar
└─ Controls: Hover effects + click
```

---

## Data Transformation Pipeline

```
RAW PRODUCT DATA (from database or mock)
│
├─ { id, name, brand, packet_size, units_per_bale, ... }
│
→ FILTER by search query
│
├─ groupedByBrand = Map<string, WholesaleProduct[]>
│
→ USER INTERACTION (quantity change)
│
├─ cart = Map<productId, quantity>
│
→ CALCULATE TOTALS (useMemo)
│
├─ cartSummary = {
│    total_bales: number,
│    total_packets: number (sum of qty × units_per_bale),
│    total_kes: number
│  }
│
→ RENDER UI
│
└─ Display: totals, items, buttons
```

---

## Performance Optimization

```
OPTIMIZATION STRATEGY:

1. MEMOIZATION
   ├─ groupedByBrand: recalc only when searchQuery changes
   └─ cartSummary: recalc only when cart changes

2. CALLBACK
   └─ handleQuantityChange: stable reference across re-renders

3. DATA STRUCTURE
   └─ cart as Map: O(1) lookups vs O(n) array operations

4. CONDITIONAL RENDERING
   ├─ TableView: only on desktop (md: breakpoint)
   ├─ MobileView: only on mobile
   └─ Sticky cart: only when cart.size > 0

5. NO EXPENSIVE OPERATIONS
   ├─ Calculations done in handler functions
   ├─ String operations in displays only
   └─ No large DOM mutations
```

---

## Integration Points (Future)

```
Currently: Mock data only
          No database calls
          No authentication
          No payment

Future Integration:
│
├─ DATABASE INTEGRATION
│  └─ Replace WHOLESALE_PRODUCTS_MOCK with Supabase query
│
├─ AUTHENTICATION
│  └─ Check user.account_type === "wholesaler"
│
├─ ORDER CREATION
│  └─ POST /api/orders with cart data
│
├─ PAYMENT PROCESSING
│  └─ Integrate M-Pesa or other payment gateway
│
└─ INVENTORY MANAGEMENT
   └─ Decrement stock_bales on order confirmation
```

---

## Error Handling (Current & Future)

```
CURRENT ERROR HANDLING:
├─ Type safety via TypeScript
├─ Disabled controls at out-of-stock
└─ Fallback empty states

FUTURE ERROR HANDLING:
├─ Network error boundaries
├─ Retry logic for failed requests
├─ User-friendly error messages
├─ Logging to error tracking (Sentry)
└─ Graceful degradation
```

---

## Summary

The Canvus Wholesale System is a **modular, performant, and scalable architecture** that:

✅ **Separates concerns** (database, types, UI)
✅ **Optimizes rendering** (memoization, callbacks)
✅ **Handles edge cases** (out of stock, empty state)
✅ **Responds to all devices** (mobile-first, responsive)
✅ **Implements Kenyan market logic** (bale-based pricing)
✅ **Ready for integration** (clear integration points)

---

*Architecture designed for maintainability, extensibility, and performance.*
