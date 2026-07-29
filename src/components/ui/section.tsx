import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      sm: "py-[var(--space-section-y-sm)]",
      lg: "py-[var(--space-section-y-lg)]",
      none: "py-0",
    },
    tone: {
      default: "bg-surface",
      raised: "bg-surface-raised",
      sunken: "bg-surface-sunken",
    },
  },
  defaultVariants: {
    spacing: "lg",
    tone: "default",
  },
});

export type SectionProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof sectionVariants>;

export function Section({ className, spacing, tone, ...props }: SectionProps) {
  return <section className={cn(sectionVariants({ spacing, tone }), className)} {...props} />;
}
