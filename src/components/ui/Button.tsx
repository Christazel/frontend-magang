import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  className = "",
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group rounded-xl";

  const variants: Record<string, string> = {
    primary:
      "text-white focus:ring-teal-500 shadow-lg",
    secondary:
      "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-teal-500 shadow-sm",
    danger:
      "text-white focus:ring-red-500 shadow-lg",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-none focus:ring-teal-500",
    outline:
      "bg-transparent border-2 border-teal-500 text-teal-600 hover:bg-teal-50 focus:ring-teal-500",
  };

  const gradients: Record<string, string> = {
    primary: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
    danger: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  };

  const sizes: Record<string, string> = {
    xs: "px-2.5 py-1 text-xs gap-1",
    sm: "px-3.5 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const inlineStyle =
    gradients[variant]
      ? {
          background: gradients[variant],
          boxShadow:
            variant === "primary"
              ? "0 6px 24px rgba(13,148,136,0.35)"
              : variant === "danger"
              ? "0 6px 24px rgba(239,68,68,0.35)"
              : undefined,
        }
      : {};

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={inlineStyle}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Hover shimmer for gradient buttons */}
      {(variant === "primary" || variant === "danger") && (
        <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-200" />
      )}

      {/* Spinner */}
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )
      )}

      <span className="relative">{children}</span>

      {!isLoading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
