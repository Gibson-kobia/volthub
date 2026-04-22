# Canvus Wholesale - Test Scenarios & Validation

## Test Suite Overview

Complete testing checklist for validating the wholesale system implementation.

---

## 1. DATABASE TESTS

### Schema Verification
- [ ] **Test 1.1:** New columns exist on `products` table
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'products' 
  AND column_name IN ('packet_size', 'units_per_bale', 'stock_bales', 'wholesale_price_per_bale', 'is_bale_product')
  -- Expected: 5 rows returned
  ```

- [ ] **Test 1.2:** Column data types are correct
  ```sql
  SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'products' AND column_name = 'units_per_bale'
  -- Expected: integer
  ```

- [ ] **Test 1.3:** `wholesale_inventory_summary` view exists and works
  ```sql
  SELECT * FROM public.wholesale_inventory_summary LIMIT 1
  -- Expected: Result set with product + pricing + stock info
  ```

- [ ] **Test 1.4:** `bale_inventory_audit` table exists
  ```sql
  SELECT * FROM public.bale_inventory_audit LIMIT 1
  -- Expected: Table structure visible (even if empty)
  ```

### Trigger Testing
- [ ] **Test 1.5:** Audit trigger fires on bale quantity change
  ```sql
  -- Update a product's stock_bales
  UPDATE products SET stock_bales = 50 WHERE id = '<test-product-id>';
  
  -- Check audit table
  SELECT * FROM bale_inventory_audit WHERE product_id = '<test-product-id>' ORDER BY created_at DESC LIMIT 1
  -- Expected: Record created with before/after values
  ```

### Data Integrity
- [ ] **Test 1.6:** Sample bale product data for testing
  ```sql
  INSERT INTO products (..., packet_size, units_per_bale, stock_bales, wholesale_price_per_bale, is_bale_product)
  VALUES ('Test Flour', 'Ajab', 'flour', '1kg', 24, 50, 1680.00, true);
  -- Verify insertion succeeds
  ```

---

## 2. TYPESCRIPT TESTS

### Type Verification
- [ ] **Test 2.1:** TypeScript compilation succeeds
  ```bash
  npm run build
  # Expected: No TypeScript errors
  ```

- [ ] **Test 2.2:** WholesaleProduct type is accessible
  ```typescript
  import { WholesaleProduct } from '@/lib/types';
  const product: WholesaleProduct = { /* valid data */ };
  // Expected: No type errors
  ```

- [ ] **Test 2.3:** Type compatibility with database types
  ```typescript
  // Should work without type errors:
  const wholesale: WholesaleProduct = {
    id: 'test-id',
    name: 'Test Product',
    packet_size: '1kg',
    units_per_bale: 24,
    stock_bales: 50,
    wholesale_price_per_bale: 1680,
    is_bale_product: true,
    // ... other DBProduct fields
  };
  ```

- [ ] **Test 2.4:** Computed properties work
  ```typescript
  const price_per_packet = product.wholesale_price_per_bale / product.units_per_bale;
  // Expected: 1680 / 24 = 70
  ```

---

## 3. COMPONENT TESTS

### Rendering & Display
- [ ] **Test 3.1:** Page loads without errors
  - Navigate to `http://localhost:3000/wholesale`
  - Expected: Page renders, no console errors

- [ ] **Test 3.2:** Header displays correctly
  - Expected: Visible title "Wholesale Bulk Orders"
  - Expected: Subtitle visible on desktop
  - Expected: Cart icon visible on mobile

- [ ] **Test 3.3:** Search bar is visible and functional
  - Type "Ajab"
  - Expected: Products filter to show only Ajab products

- [ ] **Test 3.4:** Products display with all expected fields
  - Desktop: Table with 6 columns (Product | Packet | Units | Stock | Pricing | Qty)
  - Mobile: Cards showing product name, brand, packet size, price, stock badge

- [ ] **Test 3.5:** Mock data loads (20 products visible)
  - Expected: Products from 6 categories visible
  - Categories: Flour, Rice, Milk, Essentials, Household, Snacks

---

## 4. BALE LOGIC TESTS

### Calculation Tests
- [ ] **Test 4.1:** Price per packet calculation is correct
  - Product: 1kg flour, 24 units/bale, KES 1,680 per bale
  - Expected displayed: "KES 70/packet" (1680 ÷ 24 = 70)

- [ ] **Test 4.2:** Helper text shows correct total packets
  - User orders: 2 bales of 1kg flour (24 units/bale)
  - Expected text: "48 packets" (2 × 24 = 48)

- [ ] **Test 4.3:** Cart total bales calculates correctly
  - Add: 2 bales of 1kg flour (24 units/bale)
  - Add: 1 bale of 2kg flour (12 units/bale)
  - Expected total: 3 bales, 60 packets (48 + 12)

- [ ] **Test 4.4:** Cart total KES calculates correctly
  - 2 × KES 1,680 (1kg flour) = KES 3,360
  - 1 × KES 1,680 (2kg flour) = KES 1,680
  - Expected total: KES 5,040

- [ ] **Test 4.5:** Different bale sizes compute correctly
  - 2 bales of salt (500g × 40) = 80 packets = 40kg
  - 1 bale of 1L oil (1L × 20) = 20 packets = 20L
  - Both should track independently and correctly

---

## 5. SEARCH TESTS

### Filter Functionality
- [ ] **Test 5.1:** Search by brand name
  - Input: "Ajab"
  - Expected: Only Ajab products visible
  - Expected: 2 products (1kg & 2kg flour)

- [ ] **Test 5.2:** Search by product name
  - Input: "Flour"
  - Expected: All flour products visible (Ajab, Raha, Lotus)
  - Expected: 6 products total

- [ ] **Test 5.3:** Search by category
  - Input: "Rice"
  - Expected: All rice products visible
  - Expected: 5 products (Raha, Bandari, Spencer, Nice, Beamer)

- [ ] **Test 5.4:** Case-insensitive search
  - Input: "ajab" (lowercase)
  - Expected: Same results as "AJAB" (uppercase)

- [ ] **Test 5.5:** Partial match search
  - Input: "Aj" (partial "Ajab")
  - Expected: Ajab products visible

- [ ] **Test 5.6:** Empty search shows all products
  - Clear search box
  - Expected: All 20 products visible

- [ ] **Test 5.7:** No results handling
  - Input: "NonExistentBrand"
  - Expected: "No products found" message visible

---

## 6. QUANTITY CONTROL TESTS

### Desktop Quantity Input
- [ ] **Test 6.1:** Increment button works
  - Start: 0 bales
  - Click: [+] button
  - Expected: Quantity becomes 1, text shows total packets

- [ ] **Test 6.2:** Decrement button works
  - Start: 2 bales
  - Click: [−] button
  - Expected: Quantity becomes 1

- [ ] **Test 6.3:** Can't go below 0
  - Start: 0 bales
  - Click: [−] button
  - Expected: Quantity stays 0

- [ ] **Test 6.4:** Disabled when out of stock
  - Product: Out of stock (0 bales)
  - Expected: +/− buttons disabled, no input allowed

### Mobile Quantity Controls
- [ ] **Test 6.5:** Mobile +/− buttons work on touch
  - Open page on mobile device
  - Tap [+] and [−] buttons
  - Expected: Quantity updates with each tap

---

## 7. STOCK STATUS TESTS

### Badge Display
- [ ] **Test 7.1:** "In Stock" badge displays for 4+ bales
  - Product: stock_bales = 45
  - Expected: Green badge "✓ In Stock (45)"

- [ ] **Test 7.2:** "Low Stock" badge displays for 1-3 bales
  - Product: stock_bales = 2
  - Expected: Amber badge "! Low Stock (2)"

- [ ] **Test 7.3:** "Out of Stock" badge displays for 0 bales
  - Product: stock_bales = 0
  - Expected: Gray badge "× Out of Stock (0)"
  - Expected: Quantity controls disabled

- [ ] **Test 7.4:** Stock count displays correctly in badge
  - Product: stock_bales = 15
  - Badge should show: "(15)"

---

## 8. DESKTOP LAYOUT TESTS

### Table Structure
- [ ] **Test 8.1:** Table displays on desktop (md: and larger)
  - Window width: ≥ 768px
  - Expected: Table layout visible, cards hidden

- [ ] **Test 8.2:** Brand grouping displays correctly
  - Expected: Brand header rows (e.g., "Ajab")
  - Expected: Products grouped under brand
  - Expected: Raha products after Ajab products

- [ ] **Test 8.3:** All 6 table columns visible
  - Check columns: Product | Packet | Units/Bale | Stock | Pricing | Qty
  - Expected: All columns visible with proper alignment

- [ ] **Test 8.4:** Hover effects work
  - Hover over table row
  - Expected: Row highlights with bg-slate-50

- [ ] **Test 8.5:** Sticky header works
  - Scroll down the page
  - Expected: Header and search bar remain visible at top

- [ ] **Test 8.6:** Sticky bottom cart appears when items in cart
  - Add item to cart
  - Expected: Fixed bottom bar appears
  - Shows: Bale count, packet count, total KES

---

## 9. MOBILE LAYOUT TESTS

### Responsive Design
- [ ] **Test 9.1:** Cards display on mobile (< 768px)
  - Window width: < 768px
  - Expected: Card layout visible, table hidden

- [ ] **Test 9.2:** Card layout is readable
  - Product name visible
  - Brand visible
  - Price visible
  - Stock badge visible
  - Controls visible

- [ ] **Test 9.3:** Brand section headers are sticky
  - Scroll through mobile view
  - Expected: "Flour" header stays visible while scrolling through flour products

- [ ] **Test 9.4:** Cards are full-width
  - Check card width
  - Expected: Extends left to right with padding

- [ ] **Test 9.5:** Touch controls are large enough
  - Check +/− button size
  - Expected: ≥ 44×44 px for touch targets

- [ ] **Test 9.6:** Cart drawer works
  - Tap cart button showing cart count
  - Expected: Drawer slides up from bottom
  - Expected: Draggable/dismissible

---

## 10. CART TESTS

### Desktop Cart (Sticky Bottom Bar)
- [ ] **Test 10.1:** Cart bar shows correct totals
  - Expected: "X Bales | Y packets | KES Z"
  - Values update as items added/removed

- [ ] **Test 10.2:** Clear Cart button removes all items
  - Click: Clear Cart
  - Expected: Cart emptied, bar disappears

- [ ] **Test 10.3:** Checkout button is clickable
  - Click: Proceed to Checkout
  - Expected: [Future integration point]

### Mobile Cart (Drawer)
- [ ] **Test 10.4:** Cart drawer displays all items
  - Add multiple items
  - Tap cart icon
  - Expected: Drawer shows all cart items with quantities

- [ ] **Test 10.5:** Item quantities correct in drawer
  - Item displays: "Product Name | X bales | KES Y"
  - Expected: All values accurate

- [ ] **Test 10.6:** Cart totals show in drawer
  - Expected: "Total Bales: X"
  - Expected: "Total Amount: KES Y"

- [ ] **Test 10.7:** Clear button works in drawer
  - Tap: Clear button
  - Expected: All items removed, drawer shows empty state

- [ ] **Test 10.8:** Drawer closes on backdrop tap
  - Tap dark overlay behind drawer
  - Expected: Drawer closes

- [ ] **Test 10.9:** Drawer closes on X button
  - Tap: X button
  - Expected: Drawer closes

---

## 11. INFO BOX TESTS

### Bale Logic Explanation
- [ ] **Test 11.1:** Info box visible when products shown
  - Expected: Green box with bale logic explanation
  - Text mentions: "1kg packets: 24 per bale"

- [ ] **Test 11.2:** Info box displays after search filters
  - Search for "Rice"
  - Expected: Info box still visible

- [ ] **Test 11.3:** Info box disappears when no results
  - Search for "NonExistent"
  - Expected: Info box hidden, only "no products" message

---

## 12. PERFORMANCE TESTS

### Loading & Speed
- [ ] **Test 12.1:** Page loads in < 2 seconds
  - Measure: Time to first contentful paint
  - Expected: < 2000ms

- [ ] **Test 12.2:** Search response is instant
  - Type in search box
  - Expected: Results filter instantly (< 100ms)

- [ ] **Test 12.3:** Quantity update is smooth
  - Click +/− buttons rapidly
  - Expected: UI updates without lag

- [ ] **Test 12.4:** No memory leaks
  - Open DevTools Performance tab
  - Add/remove items repeatedly
  - Expected: Memory usage stable

- [ ] **Test 12.5:** No console errors
  - Open DevTools Console
  - Interact with page
  - Expected: No errors or warnings

---

## 13. ACCESSIBILITY TESTS

### WCAG 2.1 AA Compliance
- [ ] **Test 13.1:** Color contrast meets standards
  - Text vs background: ≥ 4.5:1 ratio
  - Use: WebAIM Contrast Checker

- [ ] **Test 13.2:** Keyboard navigation works
  - Tab through all interactive elements
  - Expected: Can navigate and interact without mouse

- [ ] **Test 13.3:** Focus indicators visible
  - Tab to buttons and inputs
  - Expected: Clear focus rings visible

- [ ] **Test 13.4:** Touch targets are large enough
  - Measure: Buttons and interactive elements
  - Expected: ≥ 44×44 px

- [ ] **Test 13.5:** Page works without JavaScript
  - Disable JS in DevTools
  - Expected: Content still readable (graceful degradation)

---

## 14. BROWSER COMPATIBILITY TESTS

### Cross-Browser Testing
- [ ] **Test 14.1:** Chrome/Edge (latest)
  - Expected: Full functionality

- [ ] **Test 14.2:** Firefox (latest)
  - Expected: Full functionality

- [ ] **Test 14.3:** Safari (latest)
  - Expected: Full functionality

- [ ] **Test 14.4:** Mobile Safari (iOS)
  - Expected: Mobile layout works, touch events work

- [ ] **Test 14.5:** Chrome Mobile (Android)
  - Expected: Mobile layout works, touch events work

---

## 15. INTEGRATION TEST SCENARIOS

### Mock to Real Data Path
- [ ] **Test 15.1:** Replace mock data with Supabase query
  - Update wholesale/page.tsx to fetch from database
  - Expected: Products load from Supabase
  - Expected: Same UI appearance

- [ ] **Test 15.2:** Real product quantities update cart
  - Query products from database
  - Add items to cart
  - Expected: Cart calculations based on real data

- [ ] **Test 15.3:** Add authentication check
  - Non-wholesalers see access denied
  - Expected: WholesalerLock component shown

---

## Test Matrix

| Test Group | Count | Priority | Status |
|-----------|-------|----------|--------|
| Database | 6 | High | [ ] |
| TypeScript | 4 | High | [ ] |
| Component | 5 | High | [ ] |
| Bale Logic | 5 | Critical | [ ] |
| Search | 7 | High | [ ] |
| Quantity Control | 5 | High | [ ] |
| Stock Status | 4 | Medium | [ ] |
| Desktop Layout | 6 | High | [ ] |
| Mobile Layout | 6 | High | [ ] |
| Cart | 9 | High | [ ] |
| Info Box | 3 | Low | [ ] |
| Performance | 5 | High | [ ] |
| Accessibility | 5 | Medium | [ ] |
| Browser Compat | 5 | High | [ ] |
| Integration | 3 | Medium | [ ] |
| **TOTAL** | **82** |  | [ ] |

---

## Quick Test Checklist (5 minutes)

Essential tests to confirm basic functionality:

1. [ ] Page loads: `http://localhost:3000/wholesale`
2. [ ] Search works: Type "Ajab"
3. [ ] Quantity works: Click +/− buttons
4. [ ] Totals calculate: See cart update
5. [ ] Mobile responsive: Resize to < 768px
6. [ ] Prices show: See "KES XX/packet"
7. [ ] Stock badges show: See ✓ / ! / × indicators
8. [ ] No console errors: Check DevTools

---

## Regression Testing

After any changes:
1. Run full test suite
2. Verify no console errors
3. Test mobile layout
4. Test search functionality
5. Verify calculations

---

## Test Environment Setup

### Local Testing
```bash
# 1. Start dev server
npm run dev

# 2. Open browser
open http://localhost:3000/wholesale

# 3. Open DevTools
F12 or Cmd+Option+I

# 4. Check Console tab for errors
```

### Database Testing
```bash
# 1. Connect to Supabase
# 2. Go to SQL Editor
# 3. Run test queries (Test 1.x section)
```

---

## Test Report Template

```markdown
# Test Report - Wholesale System

Date: [Date]
Tester: [Name]
Build: [Version]

## Summary
✅ Passed: XX/XX
❌ Failed: 0/XX

## Results

### Database Tests
- [x] Schema verification
- [x] View creation
- [x] Trigger testing

### UI Tests
- [x] Desktop layout
- [x] Mobile layout
- [x] Search functionality

### Bale Logic
- [x] Calculations correct
- [x] Helper text displays
- [x] Cart totals accurate

## Issues Found
None

## Browser Tested
- Chrome 124
- Firefox 124
- Safari 17

## Conclusion
✅ Ready for production
```

---

*Use this checklist to ensure the wholesale system meets all quality standards before deployment.*
