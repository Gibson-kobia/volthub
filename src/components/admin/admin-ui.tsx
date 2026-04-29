import type { ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const TONE_STYLES: Record<string, string> = {
  slate: "border-gray-200 bg-gray-50 text-zinc-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  zinc: "border-zinc-200 bg-zinc-50 text-zinc-800",
  critical: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
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
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          {eyebrow}
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-zinc-900 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
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
        "rounded-[28px] border border-gray-200 bg-white shadow-sm",
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
    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
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
    <Surface className={cx("p-5", TONE_STYLES[tone] ?? TONE_STYLES.slate)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
        {label}
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-[2rem]">
        {value}
      </div>
      {caption ? <div className="mt-2 text-sm text-zinc-500">{caption}</div> : null}
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
    <div className="flex min-h-48 flex-col items-start justify-center gap-3 rounded-[24px] border border-dashed border-gray-200 bg-stone-50 px-6 py-8 text-left">
      <div className="text-lg font-semibold text-zinc-900">{title}</div>
      <p className="max-w-xl text-sm leading-6 text-zinc-500">{description}</p>
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
    <div className="rounded-2xl border border-gray-200 bg-stone-50 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-zinc-900">{value}</div>
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
      "bg-[#004225] text-white hover:bg-[#003018] shadow-sm",
    secondary:
      "border border-gray-200 bg-white text-zinc-900 hover:bg-gray-50",
    ghost:
      "border border-gray-200 bg-transparent text-zinc-900 hover:bg-gray-50",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
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
  return <div className="rounded-2xl border border-gray-200 bg-stone-50">{children}</div>;
}