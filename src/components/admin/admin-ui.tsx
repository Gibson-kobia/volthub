import type { ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const TONE_STYLES: Record<string, string> = {
  slate: "border-white/10 bg-white/5 text-white",
  sky: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  indigo: "border-indigo-400/20 bg-indigo-400/10 text-indigo-100",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-100",
  emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  rose: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  zinc: "border-zinc-400/20 bg-zinc-400/10 text-zinc-100",
  critical: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  ok: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
          {eyebrow}
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/64 sm:text-base">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,31,0.96),rgba(11,14,19,0.98))] shadow-[0_28px_120px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SurfaceHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-white/50">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  caption,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: string;
}) {
  return (
    <Surface className={cx("p-5", TONE_STYLES[tone])}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
        {label}
      </div>
      <div className="mt-4 text-3xl font-semibold text-white sm:text-[2rem]">{value}</div>
      {caption ? <div className="mt-2 text-sm text-white/65">{caption}</div> : null}
    </Surface>
  );
}

export function Badge({
  children,
  tone = "zinc",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase",
        TONE_STYLES[tone]
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-start justify-center gap-3 rounded-[24px] border border-dashed border-white/10 bg-white/4 px-6 py-8 text-left">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="max-w-xl text-sm leading-6 text-white/56">{description}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function KeyValue({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">{label}</div>
      <div className="mt-2 text-sm font-medium text-white/90">{value}</div>
    </div>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-[color:var(--accent)] text-white shadow-[0_16px_36px_rgba(47,107,255,0.28)] hover:bg-[#3a74ff]",
    secondary: "border border-white/12 bg-white/6 text-white hover:bg-white/10",
    ghost: "border border-transparent bg-transparent text-white/72 hover:bg-white/6 hover:text-white",
    danger: "border border-rose-400/25 bg-rose-400/12 text-rose-100 hover:bg-rose-400/18",
  };

  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function InputShell({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5">{children}</div>;
}