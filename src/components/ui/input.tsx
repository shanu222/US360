import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm transition placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-32 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm transition placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("mb-2 block text-sm font-medium text-ink", className)} {...props} />
  ),
);
Label.displayName = "Label";
