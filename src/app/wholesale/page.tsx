"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  ShoppingCart,
  Package,
  TrendingDown,
  Plus,
  Minus,
  X,
  AlertCircle,
  CheckCircle,
  Truck,
} from "lucide-react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface WholesaleProduct {
  id: string;
  name: string;
  brand: string;
  packet_size: string; // e.g., "1kg", "2kg", "500g"
  units_per_bale: number; // 24, 12, 40, etc.
  wholesale_price_per_bale: number; // KES
  retail_price: number; // KES per packet (for reference)
  stock_bales: number;
  category: string; // "Flour", "Rice", "Milk", etc.
  image?: string;
}

interface CartItem {
  product_id: string;
  product_name: string;
  brand: string;
  quantity_bales: number;
  price_per_bale: number;
  total_packets: number;
  price_per_packet: number;
}

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const getStockStatus = (bales: number): StockStatus => {
  if (bales === 0) return "out_of_stock";
  if (bales <= 3) return "low_stock";
  return "in_stock";
};

// ============================================================================
// MOCK DATA - KENYAN WHOLESALE PRODUCTS
// ============================================================================

const WHOLESALE_PRODUCTS_MOCK: WholesaleProduct[] = [
  // FLOUR (WHEAT) - Bale Rule: 24kg per bale
  {
    id: "flour-ajab-1kg",
    name: "Wheat Flour",
    brand: "Ajab",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 1680,
    retail_price: 85,
    stock_bales: 45,
    category: "Flour",
  },
  {
    id: "flour-ajab-2kg",
    name: "Wheat Flour",
    brand: "Ajab",
    packet_size: "2kg",
    units_per_bale: 12,
    wholesale_price_per_bale: 1680,
    retail_price: 170,
    stock_bales: 32,
    category: "Flour",
  },
  {
    id: "flour-raha-1kg",
    name: "Wheat Flour",
    brand: "Raha",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 1560,
    retail_price: 78,
    stock_bales: 28,
    category: "Flour",
  },
  {
    id: "flour-raha-2kg",
    name: "Wheat Flour",
    brand: "Raha",
    packet_size: "2kg",
    units_per_bale: 12,
    wholesale_price_per_bale: 1560,
    retail_price: 156,
    stock_bales: 50,
    category: "Flour",
  },
  {
    id: "flour-lotus-1kg",
    name: "Wheat Flour",
    brand: "Lotus",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 1440,
    retail_price: 72,
    stock_bales: 18,
    category: "Flour",
  },
  {
    id: "flour-lotus-2kg",
    name: "Wheat Flour",
    brand: "Lotus",
    packet_size: "2kg",
    units_per_bale: 12,
    wholesale_price_per_bale: 1440,
    retail_price: 144,
    stock_bales: 35,
    category: "Flour",
  },

  // RICE - Various brands, 1kg x 24
  {
    id: "rice-raha-1kg",
    name: "Basmati Rice",
    brand: "Raha",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 3840,
    retail_price: 185,
    stock_bales: 22,
    category: "Rice",
  },
  {
    id: "rice-bandari-1kg",
    name: "Basmati Rice",
    brand: "Bandari",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 3600,
    retail_price: 175,
    stock_bales: 15,
    category: "Rice",
  },
  {
    id: "rice-spencer-1kg",
    name: "Jasmine Rice",
    brand: "Spencer",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 3360,
    retail_price: 160,
    stock_bales: 12,
    category: "Rice",
  },
  {
    id: "rice-nice-1kg",
    name: "White Rice",
    brand: "Nice",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 3120,
    retail_price: 150,
    stock_bales: 28,
    category: "Rice",
  },
  {
    id: "rice-beamer-1kg",
    name: "Mixed Grain Rice",
    brand: "Beamer",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 2880,
    retail_price: 135,
    stock_bales: 35,
    category: "Rice",
  },

  // MILK - Mt. Kenya (crates of 12)
  {
    id: "milk-mtkenya-500ml",
    name: "Fresh Milk",
    brand: "Mt. Kenya",
    packet_size: "500ml",
    units_per_bale: 12,
    wholesale_price_per_bale: 960,
    retail_price: 95,
    stock_bales: 40,
    category: "Milk",
  },

  // ESSENTIALS
  {
    id: "sugar-1kg",
    name: "Refined Sugar",
    brand: "Mumias",
    packet_size: "1kg",
    units_per_bale: 24,
    wholesale_price_per_bale: 2160,
    retail_price: 120,
    stock_bales: 55,
    category: "Essentials",
  },
  {
    id: "salt-500g",
    name: "Iodized Salt",
    brand: "Tropical",
    packet_size: "500g",
    units_per_bale: 40,
    wholesale_price_per_bale: 1200,
    retail_price: 35,
    stock_bales: 60,
    category: "Essentials",
  },
  {
    id: "royco-cubes",
    name: "Royco Cubes",
    brand: "Royco",
    packet_size: "10 cubes",
    units_per_bale: 24,
    wholesale_price_per_bale: 960,
    retail_price: 45,
    stock_bales: 30,
    category: "Essentials",
  },
  {
    id: "cooking-oil-1l",
    name: "Cooking Oil",
    brand: "Pwani",
    packet_size: "1L",
    units_per_bale: 20,
    wholesale_price_per_bale: 8000,
    retail_price: 450,
    stock_bales: 18,
    category: "Essentials",
  },

  // HOUSEHOLD
  {
    id: "tissue-peachey",
    name: "Tissue Paper",
    brand: "Peachey",
    packet_size: "500g",
    units_per_bale: 24,
    wholesale_price_per_bale: 1440,
    retail_price: 65,
    stock_bales: 25,
    category: "Household",
  },
  {
    id: "tissue-rosey",
    name: "Tissue Paper",
    brand: "Rosey",
    packet_size: "500g",
    units_per_bale: 24,
    wholesale_price_per_bale: 1320,
    retail_price: 60,
    stock_bales: 32,
    category: "Household",
  },
  {
    id: "tissue-olx",
    name: "Tissue Roll",
    brand: "Olx",
    packet_size: "1 roll",
    units_per_bale: 12,
    wholesale_price_per_bale: 1080,
    retail_price: 100,
    stock_bales: 28,
    category: "Household",
  },

  // SNACKS
  {
    id: "biscuits-ppcl",
    name: "Digestive Biscuits",
    brand: "PPCL",
    packet_size: "200g",
    units_per_bale: 24,
    wholesale_price_per_bale: 1920,
    retail_price: 90,
    stock_bales: 20,
    category: "Snacks",
  },
  {
    id: "sweets-pipi",
    name: "Pipi Maxima Sweets",
    brand: "Pipi Maxima",
    packet_size: "100g",
    units_per_bale: 24,
    wholesale_price_per_bale: 720,
    retail_price: 35,
    stock_bales: 45,
    category: "Snacks",
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StockBadgeProps {
  status: StockStatus;
  bales: number;
}

function StockBadge({ status, bales }: StockBadgeProps) {
  const styles: Record<
    StockStatus,
    { bg: string; text: string; icon: string; label: string }
  > = {
    in_stock: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: "✓",
      label: "In Stock",
    },
    low_stock: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: "!",
      label: "Low Stock",
    },
    out_of_stock: {
      bg: "bg-slate-100 border-slate-200",
      text: "text-slate-600",
      icon: "×",
      label: "Out of Stock",
    },
  };

  const style = styles[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}
    >
      <span className="font-bold text-sm">{style.icon}</span>
      <span>{style.label}</span>
      <span className="opacity-75">({bales})</span>
    </div>
  );
}

interface PriceBreakdownProps {
  price_per_bale: number;
  units_per_bale: number;
}

function PriceBreakdown({ price_per_bale, units_per_bale }: PriceBreakdownProps) {
  const price_per_packet = price_per_bale / units_per_bale;

  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-slate-900">
        KES {price_per_bale.toLocaleString()}
      </div>
      <div className="text-xs text-slate-600 flex items-center gap-1">
        <TrendingDown className="w-3 h-3" />
        <span className="font-medium">
          KES {price_per_packet.toFixed(0)}/packet
        </span>
      </div>
    </div>
  );
}

interface QuantityControlProps {
  quantity: number;
  disabled: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  units_per_bale: number;
}

function QuantityControl({
  quantity,
  disabled,
  onIncrement,
  onDecrement,
  units_per_bale,
}: QuantityControlProps) {
  return (
    <div>
      <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={onDecrement}
          disabled={disabled || quantity === 0}
          className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4 text-slate-700" />
        </button>
        <span className="min-w-8 text-center font-semibold text-slate-900">
          {quantity}
        </span>
        <button
          onClick={onIncrement}
          disabled={disabled}
          className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4 text-emerald-600" />
        </button>
      </div>
      {quantity > 0 && (
        <div className="text-xs text-emerald-700 font-medium mt-1.5">
          {quantity * units_per_bale} packets
        </div>
      )}
    </div>
  );
}

interface ProductCardMobileProps {
  product: WholesaleProduct;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  disabled: boolean;
}

function ProductCardMobile({
  product,
  quantity,
  onQuantityChange,
  disabled,
}: ProductCardMobileProps) {
  const stockStatus = getStockStatus(product.stock_bales);
  const is_disabled = disabled || stockStatus === "out_of_stock";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-sm">{product.name}</h3>
          <p className="text-xs text-slate-600 font-medium">{product.brand}</p>
          <p className="text-xs text-slate-500 mt-1">
            {product.packet_size} × {product.units_per_bale} = ~
            {((parseInt(product.packet_size) * product.units_per_bale) / 1000).toFixed(0) ||
              product.units_per_bale * parseInt(product.packet_size.match(/\d+/)?.[0] || "1")}
            kg
          </p>
        </div>
        <StockBadge status={stockStatus} bales={product.stock_bales} />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
        <PriceBreakdown
          price_per_bale={product.wholesale_price_per_bale}
          units_per_bale={product.units_per_bale}
        />
      </div>

      <QuantityControl
        quantity={quantity}
        disabled={is_disabled}
        onIncrement={() => onQuantityChange(quantity + 1)}
        onDecrement={() => onQuantityChange(Math.max(0, quantity - 1))}
        units_per_bale={product.units_per_bale}
      />
    </div>
  );
}

interface ProductTableRowProps {
  product: WholesaleProduct;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  disabled: boolean;
}

function ProductTableRow({
  product,
  quantity,
  onQuantityChange,
  disabled,
}: ProductTableRowProps) {
  const stockStatus = getStockStatus(product.stock_bales);
  const is_disabled = disabled || stockStatus === "out_of_stock";

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-4">
        <div>
          <p className="font-semibold text-slate-900 text-sm">{product.name}</p>
          <p className="text-xs text-slate-600">{product.brand}</p>
        </div>
      </td>

      <td className="px-4 py-4 text-sm text-slate-700">
        {product.packet_size}
      </td>

      <td className="px-4 py-4 text-sm text-slate-700 text-center">
        {product.units_per_bale}
      </td>

      <td className="px-4 py-4">
        <StockBadge status={stockStatus} bales={product.stock_bales} />
      </td>

      <td className="px-4 py-4">
        <PriceBreakdown
          price_per_bale={product.wholesale_price_per_bale}
          units_per_bale={product.units_per_bale}
        />
      </td>

      <td className="px-4 py-4">
        <QuantityControl
          quantity={quantity}
          disabled={is_disabled}
          onIncrement={() => onQuantityChange(quantity + 1)}
          onDecrement={() => onQuantityChange(Math.max(0, quantity - 1))}
          units_per_bale={product.units_per_bale}
        />
      </td>
    </tr>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function WholesalePage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Group products by brand
  const groupedByBrand = useMemo(() => {
    const grouped = new Map<string, WholesaleProduct[]>();

    const filtered = WHOLESALE_PRODUCTS_MOCK.filter((product) => {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    });

    filtered.forEach((product) => {
      if (!grouped.has(product.brand)) {
        grouped.set(product.brand, []);
      }
      grouped.get(product.brand)!.push(product);
    });

    return grouped;
  }, [searchQuery]);

  const handleQuantityChange = useCallback(
    (productId: string, quantity: number) => {
      const newCart = new Map(cart);
      if (quantity === 0) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, quantity);
      }
      setCart(newCart);
    },
    [cart]
  );

  // Calculate cart totals
  const cartSummary = useMemo(() => {
    let total_bales = 0;
    let total_packets = 0;
    let total_kes = 0;

    cart.forEach((quantity, productId) => {
      const product = WHOLESALE_PRODUCTS_MOCK.find((p) => p.id === productId);
      if (product) {
        total_bales += quantity;
        total_packets += quantity * product.units_per_bale;
        total_kes += quantity * product.wholesale_price_per_bale;
      }
    });

    return { total_bales, total_packets, total_kes };
  }, [cart]);

  // Desktop Table View
  const TableView = () => (
    <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b-2 border-slate-200">
            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900">
              Product
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900">
              Packet
            </th>
            <th className="px-4 py-4 text-center text-sm font-semibold text-slate-900">
              Units/Bale
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900">
              Stock
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900">
              Pricing
            </th>
            <th className="px-4 py-4 text-center text-sm font-semibold text-slate-900">
              Qty (Bales)
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from(groupedByBrand.entries()).map(([brand, products]) => (
            <React.Fragment key={brand}>
              <tr className="bg-slate-100 hover:bg-slate-100">
                <td colSpan={6} className="px-4 py-3">
                  <p className="font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {brand}
                  </p>
                </td>
              </tr>
              {products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  quantity={cart.get(product.id) || 0}
                  onQuantityChange={(qty) =>
                    handleQuantityChange(product.id, qty)
                  }
                  disabled={false}
                />
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {groupedByBrand.size === 0 && (
        <div className="p-12 text-center text-slate-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No products found</p>
          <p className="text-sm">Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );

  // Mobile Card View
  const MobileView = () => (
    <div className="md:hidden space-y-6">
      {Array.from(groupedByBrand.entries()).map(([brand, products]) => (
        <div key={brand}>
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 rounded-lg mb-3 sticky top-20 z-10">
            <Package className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-900">{brand}</h3>
          </div>
          <div className="space-y-3 px-4">
            {products.map((product) => (
              <ProductCardMobile
                key={product.id}
                product={product}
                quantity={cart.get(product.id) || 0}
                onQuantityChange={(qty) =>
                  handleQuantityChange(product.id, qty)
                }
                disabled={false}
              />
            ))}
          </div>
        </div>
      ))}

      {groupedByBrand.size === 0 && (
        <div className="p-8 text-center text-slate-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No products found</p>
          <p className="text-sm">Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Wholesale Bulk Orders
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Enterprise Pricing for Retailers, Schools & Wholesalers
              </p>
            </div>
            <button
              onClick={() => setShowMobileCart(true)}
              className="md:hidden relative bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-3 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.size > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.size}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-20 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by brand, product, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-32 md:pb-8">
        {/* Desktop + Mobile Views */}
        <TableView />
        <MobileView />

        {/* Info Box */}
        {groupedByBrand.size > 0 && (
          <div className="mt-8 bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-900 mb-1">
                  Kenyan Bale Logic
                </p>
                <p className="text-emerald-800">
                  1kg packets: 24 per bale (24kg total) • 2kg packets: 12 per bale (24kg total) •
                  500g packets: 40 per bale (20kg total). Unit pricing shown
                  below bale price.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STICKY BOTTOM CART (Desktop) */}
      {cart.size > 0 && (
        <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t-2 border-emerald-600 shadow-2xl z-40">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold tracking-wider">
                    Order Summary
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-lg font-black text-slate-900">
                      {cartSummary.total_bales} Bales
                      <span className="text-xs text-slate-600 font-normal ml-2">
                        ({cartSummary.total_packets} packets)
                      </span>
                    </p>
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold tracking-wider">
                    Total Amount
                  </p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">
                    KES {cartSummary.total_kes.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCart(new Map())}
                  className="px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Clear Cart
                </button>
                <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg">
                  <ShoppingCart className="w-5 h-5" />
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE CART DRAWER */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileCart(false)}
          />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {Array.from(cart.entries()).map(([productId, quantity]) => {
                const product = WHOLESALE_PRODUCTS_MOCK.find(
                  (p) => p.id === productId
                );
                if (!product) return null;

                return (
                  <div
                    key={productId}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {product.brand}
                        </p>
                        <p className="text-xs text-slate-600">{product.name}</p>
                      </div>
                      <p className="font-bold text-slate-900">
                        {quantity} bales
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-600">
                        {quantity * product.units_per_bale} packets
                      </p>
                      <p className="font-semibold text-emerald-600">
                        KES{" "}
                        {(
                          quantity * product.wholesale_price_per_bale
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="border-t-2 border-slate-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-semibold text-slate-900">
                    Total Bales:
                  </p>
                  <p className="text-xl font-black text-slate-900">
                    {cartSummary.total_bales}
                  </p>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p className="font-semibold text-slate-900">
                    Total Amount:
                  </p>
                  <p className="text-2xl font-black text-emerald-600">
                    KES {cartSummary.total_kes.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCart(new Map())}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
                >
                  Clear
                </button>
                <button className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors">
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
