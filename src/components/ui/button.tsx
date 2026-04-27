import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0264af]/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[#0264af] px-4 py-3 text-white shadow-[0_10px_24px_-14px_rgba(2,100,175,0.55)] hover:bg-[#015690]",
        secondary:
          "bg-gray-100 px-4 py-3 text-slate-900 ring-1 ring-gray-200/80 hover:bg-gray-200",
        ghost:
          "px-3 py-2 text-[#0264af] hover:bg-[#0264af]/8 hover:text-[#015690]",
        outline:
          "bg-white px-4 py-3 text-slate-700 ring-1 ring-slate-200/80 hover:border-[#0264af] hover:text-[#0264af]",
      },
      size: {
        default: "h-11",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-14 rounded-xl px-5 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
