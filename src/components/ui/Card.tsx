import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-dark-paper shadow-soft rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
