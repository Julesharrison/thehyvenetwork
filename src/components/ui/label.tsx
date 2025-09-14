import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva("font-medium text-sm text-gray-700", {
  variants: {
    size: {
      default: "text-sm",
      sm: "text-xs",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants({ size }), className)}
        {...props}
      />
    );
  }
);

Label.displayName = "Label";