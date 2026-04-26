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
      className="relative inline-flex min-h-11 items-center justify-center rounded-lg border border-light-border bg-off-white px-4 text-sm font-semibold text-deep-ink transition-colors hover:bg-light-border"
    >
      <span className="inline-flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 9h14l-1.2 11H8.2L7 9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 9V7a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Cart</span>
      </span>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 min-h-5 min-w-5 rounded-full bg-primary px-1 text-[11px] font-semibold text-white">
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
    <div className="min-h-screen bg-white text-deep-ink">
      <header className="sticky top-0 z-50 border-b border-light-border bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 sm:px-6">
          <div className="text-center">
            <Link href="/" className="leading-none text-deep-ink">
              <div className="text-[1.75rem] font-extrabold tracking-[0.18em]">CANVUS</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted">
                Meru wholesale
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-light-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="text-[1.55rem] font-extrabold tracking-[0.18em] text-deep-ink">CANVUS</div>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted">
                Meru's Premier B2B & Wholesale Supply Chain. Reliable. Efficient. Local.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-light-border bg-off-white p-4 text-sm text-deep-ink">
                  Same-day Nairobi delivery before 6PM. Next-day outside Nairobi as coverage expands.
                </div>
                <div className="rounded-lg border border-light-border bg-off-white p-4 text-sm text-deep-ink">
                  M-Pesa, cards, cash on delivery, and pay on pickup supported where applicable.
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-deep-ink">Quick links</div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
                {QUICK_CATEGORY_LINKS.map((link) => (
                  <Link key={link.label} href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-deep-ink">Support</div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
                <span>Nairobi, Kenya</span>
                <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`} className="transition-colors hover:text-primary">
                  {SUPPORT_PHONE}
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-primary">
                  {SUPPORT_EMAIL}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                  WhatsApp support
                </a>
                <Link href="/#delivery" className="transition-colors hover:text-primary">
                  Delivery information
                </Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-deep-ink">Payments and channels</div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
                <span>M-Pesa STK push</span>
                <span>Card payments</span>
                <span>Cash on delivery</span>
                <span>Pay on pickup</span>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                  WhatsApp
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-primary">
                  Email updates
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-light-border bg-white px-4 py-3 lg:hidden ${hideBottomNav ? 'hidden' : ''}`}>
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-light-border bg-off-white px-4 text-sm text-muted"
            aria-label="Search"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="truncate">Search products...</span>
          </button>
          <Link href="/#categories" className="inline-flex min-h-11 w-28 flex-shrink-0 items-center justify-center rounded-lg border border-light-border bg-off-white px-4 text-sm font-semibold text-deep-ink">
            Categories
          </Link>
          <button onClick={() => setMobileOpen(true)} className="inline-flex min-h-11 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-light-border bg-off-white px-4 text-sm font-semibold text-deep-ink">
            Menu
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl px-4 pt-24 sm:px-6">
            <div className="rounded-lg border border-light-border bg-white p-6 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
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
                className="mt-4 w-full rounded-lg border border-light-border bg-off-white px-4 py-4 text-base text-deep-ink outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary/10"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {SEARCH_TRENDS.map((trend) => (
                  <button
                    key={trend}
                    onClick={() => setSearchQuery(trend)}
                    className="rounded-lg border border-light-border bg-off-white px-3 py-1 text-sm text-deep-ink transition-colors hover:bg-light-border"
                  >
                    {trend}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => runSearch(searchQuery)} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
                  Search
                </button>
                <button onClick={() => setSearchOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-light-border bg-off-white px-5 text-sm font-semibold text-deep-ink">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm border-l border-light-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[1.45rem] font-extrabold tracking-[0.16em] text-deep-ink">CANVUS</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
                  Meru wholesale
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-light-border bg-off-white px-4 text-sm font-semibold text-deep-ink">
                Close
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-4 text-base font-medium text-deep-ink">
              {HEADER_LINKS.map((link) => (
                <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-lg border border-light-border bg-off-white px-4 py-3 transition-colors hover:bg-light-border">
                  {link.label}
                </Link>
              ))}
              <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-lg border border-light-border bg-off-white px-4 py-3 transition-colors hover:bg-light-border">
                Account
              </Link>
            </div>

            <div className="mt-8 grid gap-3">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-light-border bg-off-white px-4 py-4 text-sm text-deep-ink">
                WhatsApp support and order updates
              </a>
              <div className="rounded-lg border border-light-border bg-off-white px-4 py-4 text-sm text-deep-ink">
                Same-day Nairobi delivery before 6PM. Next-day outside Nairobi.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
