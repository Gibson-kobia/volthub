import { Product, DBProduct, CategorySlug } from "./types";
import { getSupabase, diagnoseSupabaseConfig } from "./supabase";

export type { Product };

const CATEGORY_SLUGS: CategorySlug[] = [
  "audio",
  "smartwatches",
  "chargers-cables",
  "power-banks",
  "phone-accessories",
  "speakers",
  "groceries",
  "beverages",
  "household",
  "snacks",
  "personal-care",
  "electronics",
];

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function normalizeCategorySlug(input: string): CategorySlug {
  const v = input.trim().toLowerCase();
  if ((CATEGORY_SLUGS as string[]).includes(v)) return v as CategorySlug;
  return "phone-accessories";
}

// Mapper to convert DB Product to Frontend Product
export function mapDBProductToProduct(dbProduct: DBProduct): Product {
  return {
    id: dbProduct.id,
    slug: dbProduct.slug,
    name: dbProduct.name,
    brand: dbProduct.brand || "Canvus",
    category: normalizeCategorySlug(dbProduct.category),
    priceKes: dbProduct.price,
    wholesale_price: dbProduct.wholesale_price ?? undefined,
    unit_type: dbProduct.unit_type ?? undefined,
    units_per_container: dbProduct.units_per_container ?? undefined,
    image: dbProduct.image_url || "/product-placeholder.png",
    description: dbProduct.description || "",
    stock: dbProduct.stock,
    rating: Number(dbProduct.rating || 0),
    reviewsCount: Number(dbProduct.reviews_count || 0),
    is_active: dbProduct.is_active,
  };
}

// --- ASYNC FUNCTIONS FOR SUPABASE ---

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[fetchProducts] Supabase not configured. Returning empty array. Diagnosis:",
      diagnoseSupabaseConfig()
    );
    return [];
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.error(
        "[fetchProducts] Supabase client is null. This should not happen."
      );
      return [];
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or("is_archived.is.null,is_archived.eq.false")
      .gt("stock", 0);

    if (error) {
      console.error("[fetchProducts] API error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        timestamp: new Date().toISOString(),
      });
      return [];
    }

    if (!data) {
      console.warn("[fetchProducts] No data returned from query");
      return [];
    }

    console.info(
      `[fetchProducts] Successfully fetched ${data.length} products`
    );
    return data.map(mapDBProductToProduct);
  } catch (error) {
    console.error("[fetchProducts] Exception thrown:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      timestamp: new Date().toISOString(),
      diagnosis: diagnoseSupabaseConfig(),
    });
    return [];
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    console.warn(
      `[fetchProductBySlug] Supabase not configured for slug: ${slug}`
    );
    return null;
  }

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .or("is_archived.is.null,is_archived.eq.false")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`[fetchProductBySlug] Error fetching slug ${slug}:`, error);
      return null;
    }

    if (!data) {
      console.warn(`[fetchProductBySlug] No product found for slug: ${slug}`);
      return null;
    }

    return mapDBProductToProduct(data);
  } catch (err) {
    console.error(`[fetchProductBySlug] Exception for slug ${slug}:`, err);
    return null;
  }
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const normalized = normalizeCategorySlug(category);
  if (!isSupabaseConfigured()) {
    console.warn(
      `[fetchProductsByCategory] Supabase not configured for category: ${category}`
    );
    return [];
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", normalized)
      .eq("is_active", true)
      .or("is_archived.is.null,is_archived.eq.false")
      .gt("stock", 0);

    if (error) {
      console.error("[fetchProductsByCategory] failed:", {
        category: normalized,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }
    if (!data) {
      console.warn(
        `[fetchProductsByCategory] No data for category: ${normalized}`
      );
      return [];
    }
    return data.map(mapDBProductToProduct);
  } catch (error) {
    console.error("[fetchProductsByCategory] threw an exception:", {
      category: normalized,
      error,
    });
    return [];
  }
}
