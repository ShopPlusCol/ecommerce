import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-base ease-standard active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-contrast shadow-xs hover:bg-brand-hover hover:shadow-brand active:bg-brand-active",
        secondary:
          "border border-border-strong bg-surface-raised text-text hover:border-brand hover:text-brand",
        ghost: "text-text hover:bg-surface-sunken",
        soft: "bg-brand-soft text-brand hover:bg-accent-rose-soft",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        sm: "h-control-sm px-4 text-xs",
        md: "h-control-md px-5 text-sm",
        lg: "h-control-lg px-7 text-base",
        icon: "h-control-md w-control-md p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
