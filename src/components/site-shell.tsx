"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CartProvider, useCart } from "./cart/cart-provider";
import { AuthProvider, useAuth } from "./auth/auth-provider";
import { CartDrawer } from "./cart/cart-drawer";

const SUPPORT_PHONE = "+254 798 966 238";
const SUPPORT_EMAIL = "support@canvus.co.ke";
const WHATSAPP_URL = "https://wa.me/254798966238?text=Hi%20Canvus,%20I%20need%20help%20with%20my%20order.";

const HEADER_LINKS = [
  { href: "/shop", label: "Categories" },
  { href: "/#delivery", label: "Delivery" },
  { href: "/category/electronics", label: "Electronics" },
  { href: "/#support", label: "Support" },
];

const QUICK_CATEGORY_LINKS = [
  { href: "/category/groceries", label: "Groceries" },
  { href: "/category/beverages", label: "Beverages" },
  { href: "/category/snacks", label: "Snacks" },
  { href: "/category/household", label: "Household" },
  { href: "/category/personal-care", label: "Personal care" },
  { href: "/category/electronics", label: "Canvus bulk electronics" },
];

const SEARCH_TRENDS = ["groceries", "snacks", "drinks", "chargers", "earbuds"];

export function SiteShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Shell>{children}</Shell>
        <CartDrawer />
      </CartProvider>
    </AuthProvider>
  );
}

function CartButton() {
  const { count, openDrawer } = useCart();

  return (
    <button
      aria-label="Cart"
      onClick={openDrawer}
      className="relative inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/8"
    >
      <span className="inline-flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 9h14l-1.2 11H8.2L7 9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 9V7a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Cart</span>
      </span>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 min-h-5 min-w-5 rounded-full bg-[color:var(--accent)] px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function runSearch(query: string) {
    if (!query.trim()) {
      return;
    }

    setSearchOpen(false);
    setMobileOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const pathname = usePathname();

  // Hide bottom navigation on cart and checkout pages
  const hideBottomNav = pathname === "/cart" || pathname === "/checkout";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className={`sticky top-0 z-50 border-b transition-colors ${solid ? "border-[color:var(--border)] bg-[#0b0d10]/88 shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl" : "border-transparent bg-transparent"}`}>
        <div className="border-b border-white/6 bg-black/18">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/72 sm:px-6">
            <div>CANVUS WHOLESALE: Bulk partner</div>
            <div className="hidden items-center gap-4 sm:flex">
              <span>M-Pesa accepted</span>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp support
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="leading-none text-white">
              <div className="text-[1.75rem] font-extrabold tracking-[0.18em]">CANVUS</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">
                Meru wholesale
              </div>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-white/82 lg:flex">
              {HEADER_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/8"
            >
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="hidden sm:inline">Search</span>
              </span>
            </button>

            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/account" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/8">
                  Account
                </Link>
                <button onClick={logout} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/8">
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="hidden min-h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/8 sm:inline-flex">
                Account
              </Link>
            )}

            <CartButton />

            <button
              aria-label="Menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/8 lg:hidden"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-[color:var(--border)] bg-[#0c0f12]/92">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="text-[1.55rem] font-extrabold tracking-[0.18em] text-white">ZORA</div>
              <p className="mt-4 max-w-md text-sm leading-6 text-[color:var(--muted)]">
                Nairobi-first everyday shopping for groceries, drinks, snacks, household essentials, personal care, and VoltHub electronics in one clean checkout flow.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-white/88">
                  Same-day Nairobi delivery before 6PM. Next-day outside Nairobi as coverage expands.
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-white/88">
                  M-Pesa, cards, cash on delivery, and pay on pickup supported where applicable.
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Quick links</div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[color:var(--muted)]">
                {QUICK_CATEGORY_LINKS.map((link) => (
                  <Link key={link.label} href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Support</div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[color:var(--muted)]">
                <span>Nairobi, Kenya</span>
                <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`} className="transition-colors hover:text-white">
                  {SUPPORT_PHONE}
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-white">
                  {SUPPORT_EMAIL}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  WhatsApp support
                </a>
                <Link href="/#delivery" className="transition-colors hover:text-white">
                  Delivery information
                </Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Payments and channels</div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[color:var(--muted)]">
                <span>M-Pesa STK push</span>
                <span>Card payments</span>
                <span>Cash on delivery</span>
                <span>Pay on pickup</span>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  WhatsApp
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-white">
                  Email updates
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border)] bg-[#0b0d10]/92 px-4 py-3 backdrop-blur lg:hidden ${hideBottomNav ? 'hidden' : ''}`}>
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex min-h-11 flex-1 items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm text-white/50"
            aria-label="Search"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="truncate">Search products...</span>
          </button>
          <Link href="/#categories" className="inline-flex min-h-11 w-28 flex-shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white">
            Categories
          </Link>
          <button onClick={() => setMobileOpen(true)} className="inline-flex min-h-11 w-20 flex-shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white">
            Menu
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl px-4 pt-24 sm:px-6">
            <div className="rounded-[28px] border border-[color:var(--border)] bg-[#101418] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--glow)]">
                Search Canvus
              </div>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    runSearch(searchQuery);
                  }
                }}
                placeholder="Search wholesale products and bulk items"
                className="mt-4 w-full rounded-[22px] border border-[color:var(--border)] bg-white/4 px-4 py-4 text-base text-white outline-none placeholder:text-white/40 focus:border-[color:var(--glow)]"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {SEARCH_TRENDS.map((trend) => (
                  <button
                    key={trend}
                    onClick={() => setSearchQuery(trend)}
                    className="rounded-full border border-[color:var(--border)] bg-white/4 px-3 py-1 text-sm text-white/82 transition-colors hover:bg-white/8"
                  >
                    {trend}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => runSearch(searchQuery)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--accent)] px-5 text-sm font-semibold text-white">
                  Search
                </button>
                <button onClick={() => setSearchOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-5 text-sm font-semibold text-white">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm border-l border-[color:var(--border)] bg-[#0f1317] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[1.45rem] font-extrabold tracking-[0.16em] text-white">CANVUS</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
                  Everyday shopping first
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-4 text-sm font-semibold text-white">
                Close
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-4 text-base font-medium text-white">
              {HEADER_LINKS.map((link) => (
                <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 transition-colors hover:bg-white/8">
                  {link.label}
                </Link>
              ))}
              <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 transition-colors hover:bg-white/8">
                Account
              </Link>
            </div>

            <div className="mt-8 grid gap-3">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/88">
                WhatsApp support and order updates
              </a>
              <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/88">
                Same-day Nairobi delivery before 6PM. Next-day outside Nairobi.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
