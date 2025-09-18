import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            "block text-body-md mb-2 transition-colors duration-200 px-4",
            isFocused ? "text-primary" : "text-black-200"
          )}>
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "w-full px-4 py-3 bg-transparent border-2 border-light-grey rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-0 focus:ring-primary focus:ring-opacity-20 focus:shadow-glow-yellow hover:border-black-300 transition-all duration-200 caret-primary",
            "autofill:bg-transparent autofill:shadow-[inset_0_0_0px_1000px_transparent]",
            error && "border-destructive focus:border-destructive focus:ring-destructive",
            className
          )}
          style={{
            WebkitBoxShadow: "inset 0 0 0px 1000px transparent !important",
            WebkitTextFillColor: "inherit",
            backgroundColor: "transparent !important",
            backgroundImage: "none !important"
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-body-md text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }