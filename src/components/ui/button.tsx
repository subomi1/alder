import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../cn";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-ink hover:bg-ink",
        secondary: "bg-surface text-ink shadow-card hover:bg-paper-deep",
        ghost: "bg-transparent text-ink hover:bg-paper-deep",
        danger: "bg-danger text-danger-ink hover:bg-ink",
      },
      size: {
        md: "min-h-11 px-4",
        sm: "min-h-11 px-3",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
