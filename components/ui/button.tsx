import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer font-hand",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-text sketch-border border-text/20 hover:border-text/40 sketch-shadow",
        outline:
          "bg-transparent text-text sketch-border border-border hover:border-text/30",
        secondary: "bg-secondary-bg text-text sketch-border border-border/50",
        ghost: "hover:bg-secondary-bg/50 rounded-lg",
        destructive:
          "bg-danger text-white sketch-border border-black/10 shadow-sm",
        accent:
          "bg-accent text-white sketch-border border-black/10 sketch-shadow",
      },
      size: {
        default: "h-11 px-6 py-2 pb-3",
        sm: "h-9 px-4 text-xs pb-2",
        lg: "h-14 px-10 text-lg pb-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(props as any)}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
