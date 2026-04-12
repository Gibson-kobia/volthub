import Image from "next/image";
import Link from "next/link";

export type CategoryBannerCardProps = {
  title: string;
  subtitle: string;
  href: string;
  /** ImageKit (or other) URL for the card background photo. Omit for gradient-only fallback cards. */
  image?: string;
  /** Tailwind or inline CSS gradient used when no image is available. */
  gradient?: string;
  /** Optional: span 2 columns in grid (e.g. for a featured card). */
  featured?: boolean;
};

export function CategoryBannerCard({
  title,
  subtitle,
  href,
  image,
  gradient,
  featured,
}: CategoryBannerCardProps) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[20px] aspect-[3/4] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.32)] transition-all duration-300 active:scale-[0.985] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.42)]${featured ? " col-span-2 sm:col-span-1" : ""}`}
      style={!image && gradient ? { background: gradient } : undefined}
    >
      {/* Photo layer */}
      {image ? (
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          draggable={false}
        />
      ) : null}

      {/* Gradient overlay — stronger at bottom for text legibility */}
      <div
        className={`absolute inset-0 ${
          image
            ? "bg-[linear-gradient(180deg,rgba(10,10,11,0.12)_0%,rgba(10,10,11,0.38)_50%,rgba(10,10,11,0.82)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.18)_100%)]"
        }`}
      />

      {/* Pantry-Refill-style accent glow for gradient cards */}
      {!image ? (
        <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[#2f6bff]/14 blur-3xl" />
      ) : null}

      {/* Card content */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/68 leading-none">
          {subtitle}
        </div>
        <h3 className="mt-2 font-serif text-[1.2rem] leading-tight text-white sm:text-[1.3rem]">
          {title}
        </h3>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm transition-colors group-hover:border-white/28 group-hover:bg-white/16 group-hover:text-white">
          Shop
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </Link>
  );
}
