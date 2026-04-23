# CANVUS PRODUCT TEARDOWN REPORT

## Executive Summary

As Lead Architect and Product Manager, I present this comprehensive teardown of Canvus—a hybrid B2B/B2C e-commerce platform engineered for the Meru regional economy. This system represents a critical infrastructure play, bridging traditional retail gaps with modern digital fulfillment. Every architectural decision serves the unforgiving realities of regional commerce: fragmented supply chains, cash-based economies, and institutional procurement cycles.

## 1. Product Definition & Value Proposition

Canvus is a **hybrid B2B/B2C e-commerce platform** specifically engineered for the Meru regional economy. It serves as the digital backbone for staple goods distribution, connecting:

- **B2C Retailers**: Individual consumers purchasing single-unit items
- **B2B Wholesale**: Institutional buyers (schools, businesses) and resellers operating at bulk scale
- **Operational Staff**: Multi-role workforce managing fulfillment, inventory, and customer service

The platform's value proposition centers on **eliminating supply chain friction** in a region where traditional distribution fails. By digitizing inventory tracking, payment processing, and delivery coordination, Canvus transforms chaotic wholesale markets into predictable, scalable operations.

## 2. User Taxonomy & Strict Access Rules

Canvus implements a **four-tier user hierarchy** with database-enforced access controls. Each user type has precisely defined permissions, visibility scopes, and behavioral constraints.

### Retailer (Standard B2C)
- **Database Flag**: `account_type = 'retail'`
- **Access Scope**: Public catalog, retail pricing, standard checkout
- **Restrictions**: Cannot access wholesale portal, bulk pricing, or institutional features
- **Behavioral Controls**: Limited to single-unit purchases, standard delivery options

### Wholesale_General (Reseller)
- **Database Flag**: `account_type = 'wholesale_general'`, `is_verified_wholesale = true`, `application_status = 'approved'`
- **Access Scope**: Wholesale portal, bulk pricing, minimum order enforcement
- **Restrictions**: Cannot access institutional procurement flows (LPO-based ordering)
- **Behavioral Controls**: Must meet 5-unit minimum order value, M-Pesa payment required

### Wholesale_School (Institutional)
- **Database Flag**: `account_type = 'wholesale_school'`, `is_verified_wholesale = true`, `application_status = 'approved'`
- **Access Scope**: Wholesale portal, institutional pricing, LPO-based procurement
- **Restrictions**: Cannot use M-Pesa payment (credit-based institutional flow)
- **Behavioral Controls**: LPO submission required, direct WhatsApp fulfillment

### Staff Roles

#### Super Admin
- **Database Flag**: `staff_profiles.role = 'super_admin'`
- **Access Scope**: Full system administration, multi-store oversight, user management
- **Route Permissions**: `/admin/*`, `/rider/*`
- **Capabilities**: Staff role assignment, system configuration, cross-store operations

#### Store Admin
- **Database Flag**: `staff_profiles.role = 'store_admin'`
- **Access Scope**: Store-level operations, inventory management, order processing
- **Route Permissions**: `/admin`, `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/reports`, `/admin/settings`, `/admin/staff`, `/admin/pos`
- **Capabilities**: Product management, inventory adjustments, order fulfillment, staff oversight

#### Cashier
- **Database Flag**: `staff_profiles.role = 'cashier'`
- **Access Scope**: Point-of-sale operations, order processing
- **Route Permissions**: `/admin/pos`, `/admin/orders`
- **Capabilities**: In-store sales, order status updates, basic inventory visibility

#### Rider
- **Database Flag**: `staff_profiles.role = 'rider'`
- **Access Scope**: Delivery operations, dispatch management
- **Route Permissions**: `/admin/rider`, `/rider`
- **Capabilities**: Delivery assignment, status tracking, route optimization

## 3. Authentication & Authorization Flows

### Supabase Auth Integration

Canvus leverages **Supabase Auth** as the authentication backbone, with custom authorization layers enforcing business rules.

**Core Flow**:
1. User registration via `auth-provider.tsx`
2. Email confirmation required for account activation
3. Profile creation with account type assignment
4. Middleware enforcement via `middleware.ts`

### Institutional Vetting Process

The **Institutional Vetting Flow** represents Canvus's most critical authorization mechanism:

**Phase 1: Application Submission**
- User selects `wholesale_school` or `wholesale_general` during signup
- Required fields: institution name, representative role
- Database state: `application_status = 'pending'`, `is_verified_wholesale = false`

**Phase 2: Manual Admin Review**
- Admin reviews application via staff interface
- Verification process: institutional documentation, contact validation
- Decision: Approve/Reject with audit notes

**Phase 3: Access Unlocking**
- Upon approval: `application_status = 'approved'`, `is_verified_wholesale = true`
- User gains wholesale portal access
- Automatic role-based feature gating

### Middleware Protection

The `middleware.ts` file serves as the **authorization gatekeeper**:

```typescript
// Protects admin routes from non-staff users
if (!isStaffRoute(pathname)) {
  return response;
}

// Validates staff credentials and role permissions
const { data: staff } = await supabase
  .from("staff_profiles")
  .select("role,is_active")
  .eq("is_active", true)
  .ilike("email", user.email.toLowerCase().trim())
  .maybeSingle();

if (!staff?.role) {
  return NextResponse.redirect(new URL("/account?denied=staff_required", request.url));
}
```

## 4. Core Feature Teardown

### The 24kg Bale Logic Engine

Canvus implements a **sophisticated inventory tracking system** designed to prevent the inventory drift that plagues wholesale operations.

**Mathematical Foundation**:
- Standard bale: 24kg total weight
- Packaging variants: 1kg × 24 packets, 2kg × 12 packets, 500g × 48 packets
- Inventory tracking: Individual packet-level granularity

**Why Individual Packet Tracking**:
Traditional wholesale systems track bulk units (sacks, bales) but lose precision during unpacking. Canvus tracks every individual packet to prevent:

- **Inventory Drift**: Packets "disappearing" during retail unpacking
- **Stock Inaccuracies**: Mismatches between physical count and system records
- **Financial Losses**: Unaccounted goods in high-value staple commodities

**Implementation**:
```sql
-- Inventory movements table tracks every packet
CREATE TABLE inventory_movements (
  product_id UUID NOT NULL,
  movement_type TEXT CHECK (movement_type IN ('inbound', 'sale', 'return', 'adjustment')),
  quantity_change INTEGER NOT NULL, -- Individual packet count
  reference_type TEXT, -- Links to orders, adjustments
  created_by UUID -- Audit trail
);
```

### Minimum Order Value (MOV) Guardrail

The **5-unit minimum order value** serves as a critical business rule for wholesale economics.

**Economic Logic**:
- Wholesale margins depend on bulk volume
- 5-unit threshold ensures minimum viable transaction size
- Prevents retail creep into wholesale pricing

**Implementation**:
- Enforced at cart level in wholesale portal
- Database validation prevents order submission below threshold
- Clear UI messaging guides user behavior

## 5. Fulfillment & Checkout Flows (The WhatsApp Hybrid)

Canvus implements a **dual-fulfillment architecture** optimized for Kenya's payment and communication landscape.

### Split Checkout Logic

**Decision Tree**:
```
User Account Type?
├── Retail → Standard checkout (M-Pesa + delivery)
├── Wholesale_General → M-Pesa STK Push → WhatsApp invoice
└── Wholesale_School → LPO submission → WhatsApp coordination
```

### School/LPO Flow (Direct WhatsApp)
**Process**:
1. Institutional user places order
2. System generates LPO reference
3. Direct WhatsApp message to fulfillment team
4. Manual credit verification and delivery coordination

**WhatsApp Message Format**:
```
🏫 *School Credit Order*
LPO to be provided on delivery

*Institution:* [School Name]
*Representative:* [Name] ([Role])
*Order Date:* [Timestamp]

*ORDER DETAILS:*
1. Sugar (50kg Bag) - Qty: 10 Bales
2. Flour (25kg Sack) - Qty: 5 Bales

*TOTAL AMOUNT: KSh 450,000*

📍 *Delivery Location:* Meru County
📞 *Contact:* Please confirm delivery details
```

### Reseller/M-Pesa Flow (STK Push Gateway)
**Process**:
1. Reseller places order
2. M-Pesa STK Push initiated
3. Payment confirmation triggers WhatsApp invoice
4. Automated fulfillment begins

**Payment Integration**:
```sql
-- M-Pesa payment tracking
CREATE TABLE mpesa_payments (
  order_id UUID REFERENCES orders(id),
  mpesa_reference TEXT UNIQUE,
  amount_requested NUMERIC(12, 2),
  payment_status TEXT DEFAULT 'pending',
  result_code TEXT -- Success/failure codes
);
```

**WhatsApp Invoice Format**:
```
💼 *Reseller Order*
Payment Confirmed via M-Pesa

*Institution:* [Business Name]
*Representative:* [Name] ([Role])
*Order Date:* [Timestamp]

*ORDER DETAILS:*
1. Cooking Oil (20L Jerrycan) - Qty: 25 Units
2. Laundry Soap (Bale of 50) - Qty: 10 Bales

*TOTAL AMOUNT: KSh 125,000*

📍 *Delivery Location:* Meru County
📞 *Contact:* Please confirm delivery details
```

## 6. Complete Route & Section Map

### Public Routes (No Authentication Required)

| Route | Purpose | Content | Access |
|-------|---------|---------|--------|
| `/` | Homepage | Product showcase, category navigation | All users |
| `/shop` | Product catalog | Full product listing with search/filters | All users |
| `/category/[slug]` | Category pages | Products filtered by category | All users |
| `/product/[slug]` | Product detail | Individual product page with add-to-cart | All users |
| `/search` | Search results | Product search interface | All users |
| `/about` | About page | Company information | All users |
| `/offers` | Promotions | Special offers and discounts | All users |

### Authentication Routes

| Route | Purpose | Flow | Access |
|-------|---------|------|--------|
| `/auth/login` | User login | Email/password authentication | Unauthenticated users |
| `/auth/signup` | User registration | Account creation with type selection | Unauthenticated users |
| `/auth/reset` | Password reset | Email-based password recovery | Unauthenticated users |
| `/auth/confirm` | Email confirmation | Post-signup verification | New users |
| `/auth/callback` | Auth callback | Supabase auth redirects | System use |

### Protected User Routes

| Route | Purpose | Features | Access |
|-------|---------|----------|--------|
| `/account` | User dashboard | Order history, profile management | Authenticated users |
| `/cart` | Shopping cart | Cart management, checkout initiation | Authenticated users |
| `/checkout` | Order checkout | Payment processing, delivery setup | Authenticated users |
| `/wholesale` | Wholesale portal | Bulk ordering, institutional pricing | Verified wholesale users |
| `/wholesale/status` | Application status | Wholesale application tracking | Pending wholesale users |

### Staff-Only Routes

| Route | Purpose | Functions | Access |
|-------|---------|-----------|--------|
| `/admin` | Admin dashboard | System overview, key metrics | Super Admin, Store Admin |
| `/admin/products` | Product management | CRUD operations, pricing, inventory | Super Admin, Store Admin |
| `/admin/inventory` | Stock control | Inventory levels, movements, adjustments | Super Admin, Store Admin |
| `/admin/orders` | Order management | Order processing, status updates | Super Admin, Store Admin, Cashier |
| `/admin/rider` | Delivery coordination | Rider assignments, dispatch tracking | Super Admin, Rider |
| `/admin/reports` | Analytics | Revenue reports, inventory analysis | Super Admin, Store Admin |
| `/admin/pos` | Point of sale | In-store sales interface | Super Admin, Store Admin, Cashier |
| `/admin/staff` | User management | Staff roles, permissions | Super Admin, Store Admin |
| `/admin/settings` | System configuration | Store settings, business rules | Super Admin, Store Admin |

### Rider Routes

| Route | Purpose | Features | Access |
|-------|---------|----------|--------|
| `/rider` | Rider dashboard | Assigned deliveries, status updates | Active riders |

---

## Architectural Integrity Assessment

This teardown reveals Canvus as a **production-hardened system** with no architectural compromises. Every feature—from the 24kg bale logic to the institutional vetting process—serves the unforgiving economics of regional commerce. The WhatsApp hybrid fulfillment model represents pragmatic engineering: leveraging Kenya's communication infrastructure while maintaining payment security.

The platform's success depends on **relentless execution** of these architectural principles. Any deviation from the established patterns risks compromising the system's integrity in a market where trust and reliability are paramount.

**End of Report**