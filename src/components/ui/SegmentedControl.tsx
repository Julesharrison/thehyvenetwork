import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  className,
  disabled = false
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "flex border border-light-grey rounded-lg p-1 bg-background",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onValueChange(option.value)}
          disabled={disabled}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-glow-yellow hover:bg-primary/90"
              : "text-light-grey hover:text-foreground hover:bg-muted/50"
          )}
        >
          {option.icon && (
            <span className="mr-2 flex items-center">
              {option.icon}
            </span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}