import React from "react";

/* ─────────────────────────────────────────
   Card Root
───────────────────────────────────────── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Adds a soft colored glow on hover */
  hoverable?: boolean;
  /** Apply glassomorphism style instead of solid white */
  glass?: boolean;
  noPad?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverable = false,
  glass = false,
  noPad = false,
  ...props
}) => {
  const base =
    "rounded-2xl border overflow-hidden transition-all duration-200";
  const glassStyle = glass
    ? "bg-white/70 backdrop-blur-md border-white/40 shadow-glass"
    : "bg-white border-gray-100 shadow-soft";
  const hoverStyle = hoverable
    ? "hover:shadow-[0_12px_40px_rgba(13,148,136,0.12)] hover:-translate-y-0.5"
    : "";
  const padStyle = noPad ? "" : "";

  return (
    <div
      className={`${base} ${glassStyle} ${hoverStyle} ${padStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────
   Card Header
───────────────────────────────────────── */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = "",
  ...props
}) => (
  <div
    className={`flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100 ${className}`}
    {...props}
  >
    <div>
      <h2 className="text-base font-bold text-gray-800 leading-tight">{title}</h2>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-0.5 font-medium">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

/* ─────────────────────────────────────────
   Card Body
───────────────────────────────────────── */
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

/* ─────────────────────────────────────────
   Stat Card (for dashboard metrics)
───────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; up: boolean };
  color?: "teal" | "blue" | "amber" | "rose";
}

const colorMap = {
  teal: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    ring: "ring-blue-100",
    trend: "text-blue-600",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    ring: "ring-blue-100",
    trend: "text-blue-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    ring: "ring-amber-100",
    trend: "text-amber-600",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
    ring: "ring-rose-100",
    trend: "text-rose-600",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = "teal",
}) => {
  const c = colorMap[color];

  return (
    <Card hoverable className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-extrabold text-gray-800 mt-1 leading-none">
            {value}
          </p>
          {trend && (
            <p className={`text-xs font-medium mt-2 ${c.trend}`}>
              {trend.up ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${c.bg} ring-4 ${c.ring} flex items-center justify-center ${c.icon} flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};
