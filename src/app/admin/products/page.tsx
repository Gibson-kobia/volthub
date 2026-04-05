"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  AdminPageHeader,
  Badge,
  EmptyState,
  MetricCard,
  Surface,
  SurfaceHeader,
} from "@/components/admin/admin-ui";
import {
  CATEGORY_OPTIONS,
  extractSupabaseErrorMessage,
  formatCompactDate,
  formatCurrency,
  formatNumber,
  getInventoryStatus,
  getMissingProductFields,
  getMovementMeta,
  getProductSearchText,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import type { DBProduct } from "@/lib/types";

type ProductFormState = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: string;
  cost_price: string;
  stock: string;
  reorder_level: string;
  sku: string;
  barcode: string;
  supplier_name: string;
  image_url: string;
  description: string;
  is_active: boolean;
  track_inventory: boolean;
};

type StockAdjustmentState = {
  movement_type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "DAMAGED" | "EXPIRED" | "WASTAGE";
  quantity: string;
  reason: string;
  notes: string;
};

const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name" },
  { value: "price_desc", label: "Highest price" },
  { value: "price_asc", label: "Lowest price" },
  { value: "stock_asc", label: "Lowest stock" },
  { value: "stock_desc", label: "Highest stock" },
] as const;

const DEFAULT_FORM: ProductFormState = {
  name: "",
  slug: "",
  brand: "Zora",
  category: "groceries",
  price: "",
  cost_price: "",
  stock: "0",
  reorder_level: "8",
  sku: "",
  barcode: "",
  supplier_name: "",
  image_url: "",
  description: "",
  is_active: true,
  track_inventory: true,
};

const DEFAULT_ADJUSTMENT: StockAdjustmentState = {
  movement_type: "ADJUSTMENT",
  quantity: "",
  reason: "",
  notes: "",
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function compactRecord<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}

function mapProductToForm(product: DBProduct): ProductFormState {
  return {
    name: product.name || "",
    slug: product.slug || "",
    brand: product.brand || "Zora",
    category: product.category || "groceries",
    price: String(product.price ?? ""),
    cost_price: product.cost_price === null || product.cost_price === undefined ? "" : String(product.cost_price),
    stock: String(product.stock ?? 0),
    reorder_level:
      product.reorder_level === null || product.reorder_level === undefined
        ? "8"
        : String(product.reorder_level),
    sku: product.sku || "",
    barcode: product.barcode || "",
    supplier_name: product.supplier_name || "",
    image_url: product.image_url || "",
    description: product.description || "",
    is_active: product.is_active !== false,
    track_inventory: product.track_inventory !== false,
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]["value"]>("updated");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DBProduct | null>(null);
  const [form, setForm] = useState<ProductFormState>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stockProduct, setStockProduct] = useState<DBProduct | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustmentState>(DEFAULT_ADJUSTMENT);
  const [movementTableReady, setMovementTableReady] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    void fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setWarning(null);

    const [productsResult, movementProbe] = await Promise.allSettled([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("inventory_movements").select("id").limit(1),
    ]);

    if (productsResult.status === "fulfilled") {
      if (productsResult.value.error) {
        setWarning(productsResult.value.error.message);
        setProducts([]);
      } else {
        setProducts((productsResult.value.data || []) as DBProduct[]);
      }
    } else {
      setWarning(extractSupabaseErrorMessage(productsResult.reason));
      setProducts([]);
    }

    if (movementProbe.status === "fulfilled") {
      if (movementProbe.value.error) {
        setMovementTableReady(false);
        if (movementProbe.value.error.message.includes("inventory_movements")) {
          setWarning((current) => current || "Inventory movement logging is not ready until the admin migration is applied.");
        }
      } else {
        setMovementTableReady(true);
      }
    }

    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...products]
      .filter((product) => {
        if (normalizedQuery && !getProductSearchText(product).includes(normalizedQuery)) return false;
        if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
        if (statusFilter === "active" && product.is_active === false) return false;
        if (statusFilter === "inactive" && product.is_active !== false) return false;

        const inventoryStatus = getInventoryStatus(product);
        if (inventoryFilter === "low" && inventoryStatus.label !== "Low stock") return false;
        if (inventoryFilter === "out" && inventoryStatus.label !== "Out of stock") return false;
        if (inventoryFilter === "missing" && getMissingProductFields(product).length === 0) return false;

        return true;
      })
      .sort((left, right) => {
        if (sortBy === "name") return left.name.localeCompare(right.name);
        if (sortBy === "price_desc") return Number(right.price || 0) - Number(left.price || 0);
        if (sortBy === "price_asc") return Number(left.price || 0) - Number(right.price || 0);
        if (sortBy === "stock_asc") return Number(left.stock || 0) - Number(right.stock || 0);
        if (sortBy === "stock_desc") return Number(right.stock || 0) - Number(left.stock || 0);
        return new Date(right.updated_at || right.created_at || 0).getTime() - new Date(left.updated_at || left.created_at || 0).getTime();
      });
  }, [categoryFilter, inventoryFilter, products, query, sortBy, statusFilter]);

  const summary = useMemo(() => {
    const active = products.filter((product) => product.is_active !== false && !product.is_archived).length;
    const lowStock = products.filter((product) => getInventoryStatus(product).label === "Low stock").length;
    const outOfStock = products.filter((product) => Number(product.stock || 0) <= 0).length;
    const missingFields = products.filter((product) => getMissingProductFields(product).length > 0).length;
    return { active, lowStock, outOfStock, missingFields };
  }, [products]);

  function openCreateModal() {
    setEditingProduct(null);
    setForm(DEFAULT_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(product: DBProduct) {
    setEditingProduct(product);
    setForm(mapProductToForm(product));
    setFormErrors({});
    setIsModalOpen(true);
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = "Product name is required.";
    if (!form.slug.trim()) nextErrors.slug = "Slug is required.";
    if (form.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      nextErrors.slug = "Slug must be lowercase and dash-separated.";
    }
    if (!CATEGORY_OPTIONS.includes(form.category as (typeof CATEGORY_OPTIONS)[number])) {
      nextErrors.category = "Select a valid category.";
    }
    if (form.price === "" || Number(form.price) < 0) nextErrors.price = "Selling price must be zero or more.";
    if (form.cost_price !== "" && Number(form.cost_price) < 0) nextErrors.cost_price = "Cost price must be zero or more.";
    if (Number(form.stock) < 0 || !Number.isFinite(Number(form.stock))) nextErrors.stock = "Stock must be zero or more.";
    if (Number(form.reorder_level) < 0 || !Number.isFinite(Number(form.reorder_level))) {
      nextErrors.reorder_level = "Reorder level must be zero or more.";
    }
    if (form.image_url && !/^https?:\/\//i.test(form.image_url)) {
      nextErrors.image_url = "Image URL must start with http:// or https://.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!validateForm()) return;

    setSaving(true);

    const previousStock = editingProduct ? Number(editingProduct.stock || 0) : 0;
    const nextStock = Number(form.stock || 0);
    const payload = compactRecord({
      name: form.name.trim(),
      slug: form.slug.trim() || createSlug(form.name),
      brand: form.brand.trim() || "Zora",
      category: form.category,
      price: Number(form.price || 0),
      cost_price: form.cost_price === "" ? null : Number(form.cost_price),
      stock: nextStock,
      reorder_level: Number(form.reorder_level || 0),
      sku: form.sku.trim() || null,
      barcode: form.barcode.trim() || null,
      supplier_name: form.supplier_name.trim() || null,
      image_url: form.image_url.trim() || null,
      description: form.description.trim() || null,
      is_active: form.is_active,
      track_inventory: form.track_inventory,
      is_archived: false,
      archived_at: null,
    });

    try {
      let savedProduct: DBProduct | null = null;

      if (editingProduct) {
        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id)
          .select("*")
          .single();
        if (error) throw error;
        savedProduct = data as DBProduct;
      } else {
        const { data, error } = await supabase.from("products").insert([payload]).select("*").single();
        if (error) throw error;
        savedProduct = data as DBProduct;
      }

      if (savedProduct && movementTableReady && nextStock !== previousStock) {
        const quantityChange = nextStock - previousStock;
        const movementType = quantityChange >= 0 ? "STOCK_IN" : "STOCK_OUT";
        await supabase.from("inventory_movements").insert([
          {
            product_id: savedProduct.id,
            movement_type: editingProduct ? movementType : "STOCK_IN",
            quantity_change: quantityChange,
            quantity_before: previousStock,
            quantity_after: nextStock,
            reason: editingProduct ? "Product edit stock sync" : "Opening stock on product creation",
          },
        ]);
      }

      await fetchProducts();
      setIsModalOpen(false);
      setFeedback(editingProduct ? "Product updated." : "Product created.");
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: DBProduct) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);
    if (error) {
      setWarning(error.message);
      return;
    }
    setProducts((current) =>
      current.map((entry) => (entry.id === product.id ? { ...entry, is_active: !entry.is_active } : entry))
    );
  }

  async function archiveProduct(product: DBProduct) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false, is_archived: true, archived_at: new Date().toISOString() })
      .eq("id", product.id);
    if (error) {
      setWarning(error.message);
      return;
    }
    setIsModalOpen(false);
    await fetchProducts();
    setFeedback("Product archived.");
  }

  async function submitStockAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stockProduct) return;

    const quantity = Number(stockAdjustment.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setWarning("Enter a valid stock quantity for the adjustment.");
      return;
    }
    if (!stockAdjustment.reason.trim()) {
      setWarning("Enter an adjustment reason so the movement history stays useful.");
      return;
    }

    const beforeQuantity = Number(stockProduct.stock || 0);
    const delta =
      stockAdjustment.movement_type === "STOCK_IN"
        ? quantity
        : stockAdjustment.movement_type === "ADJUSTMENT"
        ? quantity - beforeQuantity
        : -quantity;
    const afterQuantity = Math.max(0, beforeQuantity + delta);

    setSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const actorEmail = sessionData.session?.user.email ?? null;

      const { error: productError } = await supabase
        .from("products")
        .update({ stock: afterQuantity })
        .eq("id", stockProduct.id);
      if (productError) throw productError;

      if (movementTableReady) {
        const { error: movementError } = await supabase.from("inventory_movements").insert([
          {
            product_id: stockProduct.id,
            movement_type: stockAdjustment.movement_type,
            quantity_change: delta,
            quantity_before: beforeQuantity,
            quantity_after: afterQuantity,
            reason: stockAdjustment.reason.trim(),
            notes: stockAdjustment.notes.trim() || null,
            actor_email: actorEmail,
          },
        ]);
        if (movementError) throw movementError;
      }

      await fetchProducts();
      setStockProduct(null);
      setStockAdjustment(DEFAULT_ADJUSTMENT);
      setFeedback(`Stock updated for ${stockProduct.name}.`);
    } catch (error) {
      setWarning(extractSupabaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalogue control"
        title="Product management with operational depth."
        description="Manage pricing, barcode-ready identifiers, stock position, reorder thresholds, and legacy-product completeness without breaking storefront product reads."
        actions={<ActionButton onClick={openCreateModal}>Add product</ActionButton>}
      />

      {warning ? (
        <Surface className="border-amber-400/18 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50/90">
          {warning}
        </Surface>
      ) : null}
      {feedback ? (
        <Surface className="border-emerald-400/18 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50/90">
          {feedback}
        </Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active products" value={formatNumber(summary.active)} caption="Currently available catalogue" tone="sky" />
        <MetricCard label="Low stock" value={formatNumber(summary.lowStock)} caption="Below current reorder levels" tone="amber" />
        <MetricCard label="Out of stock" value={formatNumber(summary.outOfStock)} caption="Unavailable until restocked" tone="rose" />
        <MetricCard label="Missing core info" value={formatNumber(summary.missingFields)} caption="Legacy rows still need enrichment" tone="indigo" />
      </div>

      <Surface>
        <SurfaceHeader title="Product operations" description="Search, filter, sort, edit, archive, and adjust stock without hiding older products that are missing newer fields." />
        <div className="grid gap-3 border-b border-white/8 px-5 py-5 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] sm:px-6">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, SKU, barcode, brand, slug"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
          >
            <option value="all">All categories</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category.replaceAll("-", " ")}
              </option>
            ))}
          </select>
          <select
            value={inventoryFilter}
            onChange={(event) => setInventoryFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
          >
            <option value="all">All stock states</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
            <option value="missing">Missing product info</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as (typeof SORT_OPTIONS)[number]["value"])}
            className="rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-sm text-white outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto px-2 py-2 sm:px-3">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[color:var(--accent)]" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="px-3 py-3">
              <EmptyState
                title="No matching products"
                description="Adjust the filters or add products. Legacy rows remain visible here even when they are missing newer admin fields."
                action={<ActionButton onClick={openCreateModal}>Create product</ActionButton>}
              />
            </div>
          ) : (
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-white/42">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Identifiers</th>
                  <th className="px-4 py-2 font-medium">Selling / cost</th>
                  <th className="px-4 py-2 font-medium">Stock</th>
                  <th className="px-4 py-2 font-medium">State</th>
                  <th className="px-4 py-2 font-medium">Updated</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockState = getInventoryStatus(product);
                  const missingFields = getMissingProductFields(product);
                  return (
                    <tr key={product.id} className="rounded-[22px] bg-white/4 align-top">
                      <td className="rounded-l-[22px] px-4 py-4">
                        <div className="flex items-start gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-14 w-14 rounded-2xl object-cover" />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/12 text-xs text-white/30">
                              IMG
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">{product.name}</div>
                            <div className="mt-1 text-sm text-white/52">
                              {product.brand || "Brand pending"} · {product.category}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge tone={product.is_active === false ? "zinc" : "emerald"}>
                                {product.is_active === false ? "Inactive" : "Active"}
                              </Badge>
                              {missingFields.length > 0 ? <Badge tone="amber">Missing info</Badge> : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white/72">
                        <div>SKU: {product.sku || "Not set"}</div>
                        <div className="mt-1">Barcode: {product.barcode || "Not set"}</div>
                        <div className="mt-1 text-white/45">Slug: {product.slug}</div>
                      </td>
                      <td className="px-4 py-4 text-white/72">
                        <div>{formatCurrency(product.price)}</div>
                        <div className="mt-1 text-white/45">
                          Cost: {product.cost_price === undefined || product.cost_price === null ? "Not set" : formatCurrency(product.cost_price)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white/72">
                        <div className="text-base font-semibold text-white">{formatNumber(product.stock)}</div>
                        <div className="mt-1 text-white/45">Reorder: {formatNumber(product.reorder_level ?? 8)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={stockState.tone}>{stockState.label}</Badge>
                        </div>
                        {missingFields.length > 0 ? (
                          <div className="mt-2 max-w-xs text-xs leading-5 text-white/45">Missing {missingFields.join(", ")}.</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-white/52">{formatCompactDate(product.updated_at || product.created_at)}</td>
                      <td className="rounded-r-[22px] px-4 py-4">
                        <div className="flex flex-col items-end gap-2">
                          <ActionButton variant="ghost" onClick={() => openEditModal(product)}>
                            Edit
                          </ActionButton>
                          <ActionButton
                            variant="secondary"
                            onClick={() => {
                              setStockProduct(product);
                              setStockAdjustment(DEFAULT_ADJUSTMENT);
                              setWarning(null);
                            }}
                          >
                            Quick stock update
                          </ActionButton>
                          <ActionButton variant="ghost" onClick={() => void toggleActive(product)}>
                            {product.is_active === false ? "Activate" : "Pause"}
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Surface>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#0d1218] shadow-[0_40px_140px_rgba(0,0,0,0.45)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/8 bg-[#0d1218]/95 px-6 py-5 backdrop-blur">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">Product editor</div>
                <div className="mt-2 text-2xl font-semibold text-white">{editingProduct ? "Update product" : "Create product"}</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-sm font-semibold text-white/60 hover:text-white">
                Close
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-white/70">
                  <span>Product name</span>
                  <input
                    value={form.name}
                    onChange={(event) => {
                      const value = event.target.value;
                      const nextSlug = !form.slug || form.slug === createSlug(form.name) ? createSlug(value) : form.slug;
                      setForm((current) => ({ ...current, name: value, slug: nextSlug }));
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                  {formErrors.name ? <span className="text-xs text-rose-300">{formErrors.name}</span> : null}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Slug</span>
                  <input
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                  {formErrors.slug ? <span className="text-xs text-rose-300">{formErrors.slug}</span> : null}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Brand</span>
                  <input
                    value={form.brand}
                    onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Category</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-white outline-none"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category.replaceAll("-", " ")}
                      </option>
                    ))}
                  </select>
                  {formErrors.category ? <span className="text-xs text-rose-300">{formErrors.category}</span> : null}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Selling price</span>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                  {formErrors.price ? <span className="text-xs text-rose-300">{formErrors.price}</span> : null}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Cost price</span>
                  <input
                    type="number"
                    min="0"
                    value={form.cost_price}
                    onChange={(event) => setForm((current) => ({ ...current, cost_price: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                  {formErrors.cost_price ? <span className="text-xs text-rose-300">{formErrors.cost_price}</span> : null}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Stock quantity</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                  {formErrors.stock ? <span className="text-xs text-rose-300">{formErrors.stock}</span> : null}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Low-stock threshold</span>
                  <input
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={(event) => setForm((current) => ({ ...current, reorder_level: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                  {formErrors.reorder_level ? <span className="text-xs text-rose-300">{formErrors.reorder_level}</span> : null}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>SKU</span>
                  <input
                    value={form.sku}
                    onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Barcode</span>
                  <input
                    value={form.barcode}
                    onChange={(event) => setForm((current) => ({ ...current, barcode: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Supplier</span>
                  <input
                    value={form.supplier_name}
                    onChange={(event) => setForm((current) => ({ ...current, supplier_name: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                  <span>Image URL</span>
                  <input
                    value={form.image_url}
                    onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                  {formErrors.image_url ? <span className="text-xs text-rose-300">{formErrors.image_url}</span> : null}
                </label>
                <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                  <span>Description</span>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-white/70">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                  />
                  <span>Active for sale</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.track_inventory}
                    onChange={(event) => setForm((current) => ({ ...current, track_inventory: event.target.checked }))}
                  />
                  <span>Track inventory and stock pressure</span>
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {editingProduct ? (
                    <ActionButton variant="danger" type="button" onClick={() => void archiveProduct(editingProduct)}>
                      Archive product
                    </ActionButton>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <ActionButton variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </ActionButton>
                  <ActionButton type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingProduct ? "Save changes" : "Create product"}
                  </ActionButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {stockProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0d1218] shadow-[0_40px_140px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">Stock operation</div>
                <div className="mt-2 text-2xl font-semibold text-white">{stockProduct.name}</div>
              </div>
              <button onClick={() => setStockProduct(null)} className="text-sm font-semibold text-white/60 hover:text-white">
                Close
              </button>
            </div>

            <form onSubmit={submitStockAdjustment} className="space-y-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-white/70">
                  <span>Movement type</span>
                  <select
                    value={stockAdjustment.movement_type}
                    onChange={(event) =>
                      setStockAdjustment((current) => ({
                        ...current,
                        movement_type: event.target.value as StockAdjustmentState["movement_type"],
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#10161d] px-4 py-3 text-white outline-none"
                  >
                    {(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "DAMAGED", "EXPIRED", "WASTAGE"] as const).map((type) => {
                      const meta = getMovementMeta(type);
                      return (
                        <option key={type} value={type}>
                          {meta.label}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>{stockAdjustment.movement_type === "ADJUSTMENT" ? "Target stock quantity" : "Quantity"}</span>
                  <input
                    type="number"
                    min="0"
                    value={stockAdjustment.quantity}
                    onChange={(event) => setStockAdjustment((current) => ({ ...current, quantity: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                  <span>Reason</span>
                  <input
                    value={stockAdjustment.reason}
                    onChange={(event) => setStockAdjustment((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="e.g. supplier delivery, breakage, shrinkage, count correction"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                  <span>Notes</span>
                  <textarea
                    rows={4}
                    value={stockAdjustment.notes}
                    onChange={(event) => setStockAdjustment((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/68">
                Current stock: <span className="font-semibold text-white">{formatNumber(stockProduct.stock)}</span>
                {movementTableReady ? " · Movement will be written to inventory history." : " · Stock will update, but movement logging needs the migration first."}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/8 pt-5">
                <ActionButton variant="ghost" type="button" onClick={() => setStockProduct(null)}>
                  Cancel
                </ActionButton>
                <ActionButton type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Apply stock change"}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
