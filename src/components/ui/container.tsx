import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({
  narrow,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { narrow?: boolean }) {
  return (
    <div
      className={cn("mx-auto w-full px-[var(--content-padding-x)]", className)}
      style={{
        maxWidth: narrow ? "var(--content-max-width-narrow)" : "var(--content-max-width)",
      }}
      {...props}
    />
  );
}
