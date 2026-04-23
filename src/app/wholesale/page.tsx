"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  CheckCircle,
  Truck,
  Lock,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { WholesalerLocked } from "@/components/wholesale/wholesaler-locked";
import { formatWhatsAppMessage } from "@/lib/whatsapp";
import { useAuth } from "@/components/auth/auth-provider";
import { getUserProfile, canAccessWholesale, UserProfile } from "@/lib/wholesale-profile";
import { fetchProducts, Product } from "@/lib/products";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
type UserTier = "guest" | "retail" | "wholesale" | "bulk_buyer";

interface WholesaleProduct {
  id: string;
  name: string;
  brand: string;
  stockStatus: StockStatus;
  retailPrice: number; // KES per retail unit
  wholesalePrice: number; // KES per bulk unit
  bulkUnit: string; // e.g., "50kg Sack", "Bale of 12", "Carton"
  retailUnit: string; // e.g., "1kg", "Single", "Pack"
  estimatedWeight: number; // kg per bulk unit
  availableQuantity: number; // how many bulk units in stock
  category: string;
}

interface CartItem {
  productId: string;
  quantity: number; // number of bulk units
}

// Kenyan staple products mock
const PRODUCTS_MOCK: WholesaleProduct[] = [
  {
    id: "sugar-001",
    name: "Sugar",
    brand: "Kabras Sugar",
    stockStatus: "in_stock",
    retailPrice: 120,
    wholesalePrice: 4500,
    bulkUnit: "50kg Bag",
    retailUnit: "1kg",
    estimatedWeight: 50,
    availableQuantity: 150,
    category: "Staples",
  },
  {
    id: "flour-002",
    name: "Flour",
    brand: "Ajab",
    stockStatus: "in_stock",
    retailPrice: 85,
    wholesalePrice: 3200,
    bulkUnit: "25kg Sack",
    retailUnit: "2kg",
    estimatedWeight: 25,
    availableQuantity: 200,
    category: "Staples",
  },
  {
    id: "cooking-oil-003",
    name: "Cooking Oil",
    brand: "Pwani",
    stockStatus: "in_stock",
    retailPrice: 450,
    wholesalePrice: 8500,
    bulkUnit: "20L Jerrycan",
    retailUnit: "1L",
    estimatedWeight: 20,
    availableQuantity: 80,
    category: "Oils",
  },
  {
    id: "rice-004",
    name: "Rice (Basmati)",
    brand: "Sunrice",
    stockStatus: "low_stock",
    retailPrice: 180,
    wholesalePrice: 6800,
    bulkUnit: "50kg Bag",
    retailUnit: "1kg",
    estimatedWeight: 50,
    availableQuantity: 25,
    category: "Staples",
  },
  {
    id: "soap-005",
    name: "Laundry Soap",
    brand: "Omo",
    stockStatus: "in_stock",
    retailPrice: 45,
    wholesalePrice: 1600,
    bulkUnit: "Bale of 50",
    retailUnit: "Single",
    estimatedWeight: 12,
    availableQuantity: 300,
    category: "Detergents",
  },
  {
    id: "salt-006",
    name: "Iodized Salt",
    brand: "Tropical",
    stockStatus: "in_stock",
    retailPrice: 30,
    wholesalePrice: 900,
    bulkUnit: "50kg Bag",
    retailUnit: "1kg",
    estimatedWeight: 50,
    availableQuantity: 120,
    category: "Condiments",
  },
  {
    id: "beans-007",
    name: "Dried Beans",
    brand: "Upland",
    stockStatus: "low_stock",
    retailPrice: 160,
    wholesalePrice: 5500,
    bulkUnit: "50kg Bag",
    retailUnit: "1kg",
    estimatedWeight: 50,
    availableQuantity: 15,
    category: "Staples",
  },
  {
    id: "maize-008",
    name: "Maize Flour",
    brand: "Unga",
    stockStatus: "in_stock",
    retailPrice: 95,
    wholesalePrice: 3600,
    bulkUnit: "25kg Sack",
    retailUnit: "2kg",
    estimatedWeight: 25,
    availableQuantity: 180,
    category: "Staples",
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * WholesalerLocked: Moved to components - now imported as WholesalerLocked
 * Component is now in src/components/wholesale/wholesaler-locked.tsx
 */

/**
 * SearchBar: Sticky search input for finding products
 */
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

function SearchBar({ onSearch, placeholder = "Search products..." }: SearchBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-slate-200 p-4 shadow-sm">
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={placeholder}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * StockBadge: Visual indicator of stock status
 */
function StockBadge({ status }: { status: StockStatus }) {
  const styles: Record<StockStatus, { bg: string; text: string; label: string }> = {
    in_stock: { bg: "bg-green-50", text: "text-green-700", label: "In Stock" },
    low_stock: { bg: "bg-amber-50", text: "text-amber-700", label: "Low Stock" },
    out_of_stock: { bg: "bg-slate-100", text: "text-slate-600", label: "Out of Stock" },
  };

  const style = styles[status];

  return (
    <span className={`${style.bg} ${style.text} text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1`}>
      <span className={`w-2 h-2 rounded-full ${style.text === "text-green-700" ? "bg-green-500" : style.text === "text-amber-700" ? "bg-amber-500" : "bg-slate-400"}`} />
      {style.label}
    </span>
  );
}

/**
 * SavingsBadge: Shows KES savings vs retail price
 */
function SavingsBadge({
  retailPrice,
  wholesalePrice,
  bulkUnit,
}: {
  retailPrice: number;
  wholesalePrice: number;
  bulkUnit: string;
}) {
  // Extract quantity from bulkUnit (e.g., "50kg Bag" -> 50)
  const quantity = parseInt(bulkUnit) || 1;
  const totalRetailValue = retailPrice * quantity;
  const savings = totalRetailValue - wholesalePrice;
  const savingsPercent = ((savings / totalRetailValue) * 100).toFixed(0);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center"
    >
      <div className="text-xs text-emerald-700 font-semibold">
        Save KES {savings.toLocaleString()}
      </div>
      <div className="text-xs text-emerald-600">{savingsPercent}% off retail</div>
    </motion.div>
  );
}

/**
 * ProductRow: Single row in the wholesale table (desktop)
 */
interface ProductRowProps {
  product: WholesaleProduct;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
}

function ProductRow({
  product,
  quantity,
  onQuantityChange,
}: ProductRowProps) {
  return (
    <motion.tr
      layout
      animate={{
        backgroundColor: quantity > 0 ? "rgb(243, 250, 255)" : "rgb(255, 255, 255)",
      }}
      transition={{ duration: 0.2 }}
      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
    >
      {/* Product Name & Brand */}
      <td className="px-4 py-4">
        <div className="font-semibold text-slate-900">{product.name}</div>
        <div className="text-xs text-slate-500">{product.brand}</div>
      </td>

      {/* Stock Status */}
      <td className="px-4 py-4">
        <StockBadge status={product.stockStatus} />
      </td>

      {/* Retail Price (Crossed Out) */}
      <td className="px-4 py-4">
        <div className="line-through text-slate-500 text-sm">
          KES {product.retailPrice.toLocaleString()} / {product.retailUnit}
        </div>
      </td>

      {/* Wholesale Price (Bold) */}
      <td className="px-4 py-4">
        <div className="font-bold text-slate-900 text-lg">
          KES {product.wholesalePrice.toLocaleString()}
        </div>
        <div className="text-xs text-slate-600">per {product.bulkUnit.toLowerCase()}</div>
      </td>

      {/* Savings Badge */}
      <td className="px-4 py-4">
        <SavingsBadge
          retailPrice={product.retailPrice}
          wholesalePrice={product.wholesalePrice}
          bulkUnit={product.bulkUnit}
        />
      </td>

      {/* Quantity Input */}
      <td className="px-4 py-4">
        <motion.div
          animate={{
            scale: quantity > 0 ? 1.05 : 1,
          }}
          transition={{ duration: 0.15 }}
        >
          <input
            type="number"
            min="0"
            max={product.availableQuantity}
            value={quantity}
            onChange={(e) =>
              onQuantityChange(product.id, Math.max(0, parseInt(e.target.value) || 0))
            }
            className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="0"
          />
          <div className="text-xs text-slate-500 mt-1 text-center">
            {product.availableQuantity} avail.
          </div>
        </motion.div>
      </td>
    </motion.tr>
  );
}

/**
 * ProductCard: Mobile-optimized compact card view
 */
interface ProductCardProps {
  product: WholesaleProduct;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
}

function ProductCard({
  product,
  quantity,
  onQuantityChange,
}: ProductCardProps) {
  return (
    <motion.div
      layout
      animate={{
        backgroundColor: quantity > 0 ? "rgb(243, 250, 255)" : "rgb(255, 255, 255)",
      }}
      transition={{ duration: 0.2 }}
      className="border border-slate-200 rounded-lg p-4 mb-3"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{product.name}</h3>
          <p className="text-xs text-slate-500">{product.brand}</p>
        </div>
        <StockBadge status={product.stockStatus} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-slate-600 font-medium mb-1">Retail Price</div>
          <div className="line-through text-slate-500 text-xs">
            KES {product.retailPrice} / {product.retailUnit}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-600 font-medium mb-1">Wholesale Price</div>
          <div className="font-bold text-slate-900">
            KES {product.wholesalePrice.toLocaleString()}
          </div>
          <div className="text-xs text-slate-600">per {product.bulkUnit}</div>
        </div>
      </div>

      <SavingsBadge
        retailPrice={product.retailPrice}
        wholesalePrice={product.wholesalePrice}
        bulkUnit={product.bulkUnit}
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-600">{product.availableQuantity} available</span>
        <input
          type="number"
          min="0"
          max={product.availableQuantity}
          value={quantity}
          onChange={(e) =>
            onQuantityChange(product.id, Math.max(0, parseInt(e.target.value) || 0))
          }
          className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          placeholder="0"
        />
      </div>
    </motion.div>
  );
}

/**
 * FloatingSummary: Sticky bottom HUD showing order totals
 */
interface FloatingSummaryProps {
  cartItems: CartItem[];
  products: WholesaleProduct[];
  onConfirm: () => void;
  canCheckout?: boolean;
  movRequired?: number;
  totalQuantity?: number;
}

function FloatingSummary({
  cartItems,
  products,
  onConfirm,
  canCheckout = true,
  movRequired = 5,
  totalQuantity = 0,
}: FloatingSummaryProps) {
  const totalQtyCalc = totalQuantity || cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalWeight = cartItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.estimatedWeight * item.quantity : 0);
  }, 0);

  const totalAmount = cartItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.wholesalePrice * item.quantity : 0);
  }, 0);

  if (totalQtyCalc === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl px-4 py-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-semibold mb-1">BULK UNITS</div>
            <div className={`text-2xl font-bold ${totalQtyCalc < movRequired ? 'text-red-600' : 'text-slate-900'}`}>
              {totalQtyCalc}{totalQtyCalc < movRequired && ` / ${movRequired}`}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-semibold mb-1">EST. WEIGHT</div>
            <div className="text-2xl font-bold text-slate-900">
              {totalWeight}
              <span className="text-lg ml-1">kg</span>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 col-span-2 md:col-span-2">
            <div className="text-xs text-emerald-700 font-semibold mb-1">
              TOTAL ORDER VALUE
            </div>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">
              KES {totalAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={canCheckout ? { scale: 1.02 } : {}}
          whileTap={canCheckout ? { scale: 0.98 } : {}}
          onClick={onConfirm}
          disabled={!canCheckout}
          className={`w-full font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
            canCheckout
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-100 text-red-700 cursor-not-allowed"
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          {canCheckout ? "CONFIRM ORDER" : `MINIMUM ${movRequired} UNITS REQUIRED`}
        </motion.button>
      </div>
    </motion.div>
  );
}

/**
 * ConfirmOrderModal: Modal to confirm and submit order
 */
interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  cartItems: CartItem[];
  products: WholesaleProduct[];
}

function ConfirmOrderModal({
  isOpen,
  onClose,
  onSubmit,
  cartItems,
  products,
}: ConfirmOrderModalProps) {
  const totalAmount = cartItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.wholesalePrice * item.quantity : 0);
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:px-4"
          >
            <motion.div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-slate-900">
                  Review Your Order
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Order Items List */}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Order Items</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cartItems.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      if (!product) return null;

                      return (
                        <div
                          key={item.productId}
                          className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-slate-900">
                              {product.name}
                            </div>
                            <div className="text-xs text-slate-600">
                              {item.quantity} × {product.bulkUnit}
                            </div>
                          </div>
                          <div className="font-semibold text-slate-900">
                            KES {(product.wholesalePrice * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-4" />

                {/* Total */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700">Subtotal:</span>
                    <span className="font-semibold text-slate-900">
                      KES {totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-700">Delivery:</span>
                    <span className="text-sm text-slate-600">
                      To be confirmed
                    </span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-emerald-900">
                        Estimated Total:
                      </span>
                      <span className="text-2xl font-bold text-emerald-600">
                        KES {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-700">
                    📱 <strong>You'll be redirected to WhatsApp</strong> for order confirmation. Our team will then contact you within 2 hours to arrange delivery.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSubmit}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Truck className="w-5 h-5" />
                    SUBMIT ORDER TO WHATSAPP
                  </motion.button>
                  <button
                    onClick={onClose}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function WholesalePage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and cart state
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
      }

      const fetchedProducts = await fetchProducts();
      setProducts(fetchedProducts);
      setLoading(false);
    };

    loadData();
  }, [user]);

  // Convert products to wholesale format
  const wholesaleProducts: WholesaleProduct[] = useMemo(() => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      stockStatus: product.stock > 10 ? "in_stock" : product.stock > 0 ? "low_stock" : "out_of_stock",
      retailPrice: product.priceKes,
      wholesalePrice: Math.floor(product.priceKes * 0.8 * 50), // Example: 50 units at 20% discount
      bulkUnit: "50 Units",
      retailUnit: "1 Unit",
      estimatedWeight: 25, // Example weight
      availableQuantity: Math.floor(product.stock / 50), // Convert to bulk units
      category: product.category,
    }));
  }, [products]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return wholesaleProducts;

    const query = searchQuery.toLowerCase();
    return wholesaleProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
  }, [wholesaleProducts, searchQuery]);

  // Handle quantity change
  const handleQuantityChange = function(productId: string, quantity: number) {
    console.log(productId, quantity);
  };

  // Check MOV (Minimum Order Value: 5 units)
  const totalQuantity = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const MOV_REQUIRED = 5;
  const canCheckout = totalQuantity >= MOV_REQUIRED;

  // Handle order confirmation
  const handleConfirmOrder = function() {
    if (totalQuantity < MOV_REQUIRED) {
      alert(`Order must be at least ${MOV_REQUIRED} bulk units`);
      return;
    }

    try {
      // Calculate totals
      const totalAmount = cart.reduce((sum, item) => {
        const product = wholesaleProducts.find((p) => p.id === item.productId);
        return sum + (product ? product.wholesalePrice * item.quantity : 0);
      }, 0);

      // Format order items for WhatsApp
      const items = cart
        .map((item) => {
          const product = wholesaleProducts.find((p) => p.id === item.productId);
          if (!product) return null;
          return {
            name: product.name,
            size: product.bulkUnit,
            quantity: item.quantity,
            unitPrice: product.wholesalePrice,
            subtotal: product.wholesalePrice * item.quantity,
          };
        })
        .filter(Boolean);

      // Generate WhatsApp message using utility
      const orderDetails = {
        items: items as any,
        totalAmount,
        userName: userProfile?.full_name || user?.name || "Customer",
        userRole: userProfile?.rep_role || "Wholesale Buyer",
        institutionName: userProfile?.institution_name || "Your Institution",
        orderType: userProfile?.account_type === "wholesale_school" ? "school_credit" : "reseller_paid" as any,
      };

      const whatsappMessage = formatWhatsAppMessage(orderDetails);
      const whatsappUrl = `https://wa.me/254712345678?text=${whatsappMessage}`;

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");

      // Reset UI
      setCart([]);
      setIsModalOpen(false);
      alert("Opening WhatsApp... Our team will contact you shortly to confirm details.");
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Error processing order. Please try again.");
    }
  };

  // Check if user can access wholesale
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || !canAccessWholesale(userProfile)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <WholesalerLocked />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Wholesale Bulk Portal
            </h1>
            <p className="text-slate-600">
              Fast ordering for school bursars, shop owners & traders
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={setSearchQuery} />

      {/* Results count */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto text-sm text-slate-600">
          Showing {filteredProducts.length} products
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-32">
        <div className="max-w-6xl mx-auto">
          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No products found
              </h3>
              <p className="text-slate-600">
                Try searching with a different term (e.g., "Sugar", "Flour", "Oil")
              </p>
            </motion.div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-900">
                        Product
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-900">
                        Stock
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-900">
                        Retail Price
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-900">
                        Wholesale Price
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-900">
                        Savings
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-900">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        quantity={
                          cart.find((item) => item.productId === product.id)
                            ?.quantity || 0
                        }
                        onQuantityChange={handleQuantityChange}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={
                      cart.find((item) => item.productId === product.id)
                        ?.quantity || 0
                    }
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Summary */}
      <AnimatePresence>
        {cart.length > 0 && (
          <FloatingSummary
            cartItems={cart}
            products={wholesaleProducts}
            onConfirm={() => setIsModalOpen(true)}
            canCheckout={canCheckout}
            movRequired={MOV_REQUIRED}
            totalQuantity={totalQuantity}
          />
        )}
      </AnimatePresence>

      {/* Confirm Order Modal */}
      <ConfirmOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleConfirmOrder}
        cartItems={cart}
        products={wholesaleProducts}
      />
    </>
  );
}

