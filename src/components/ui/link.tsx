import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface LinkProps extends Omit<RouterLinkProps, 'className'> {
  children: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'muted';
  underline?: boolean;
  className?: string;
  disabled?: boolean;
}

export function Link({
  children,
  leadingIcon,
  trailingIcon,
  variant = 'default',
  underline = false,
  className,
  disabled = false,
  ...props
}: LinkProps) {
  const baseClasses = "inline-flex items-center transition-all";

  const variantClasses = {
    default: "text-foreground hover:text-primary",
    primary: "text-primary hover:text-primary/80",
    muted: "text-light-grey hover:text-foreground"
  };

  const underlineClasses = underline ? "hover:underline" : "";
  const disabledClasses = disabled ? "opacity-50 pointer-events-none" : "";

  return (
    <RouterLink
      className={cn(
        baseClasses,
        variantClasses[variant],
        underlineClasses,
        disabledClasses,
        className
      )}
      {...props}
    >
      {leadingIcon && (
        <span className="mr-2 flex items-center">
          {leadingIcon}
        </span>
      )}
      {children}
      {trailingIcon && (
        <span className="ml-2 flex items-center">
          {trailingIcon}
        </span>
      )}
    </RouterLink>
  );
}