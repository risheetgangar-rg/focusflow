import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_0_rgb(255_255_255/0.14)_inset,0_8px_18px_-10px_rgb(0_0_0/0.55)] hover:-translate-y-px hover:bg-primary/88",
        brand:
          "bg-brand text-brand-foreground shadow-[0_10px_24px_-10px_var(--brand)] hover:-translate-y-px hover:brightness-110",
        outline:
          "border-border bg-card text-foreground hover:border-foreground/25 hover:bg-muted aria-expanded:bg-muted",
        soft: "bg-brand-soft text-brand hover:brightness-95",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/18",
        link: "rounded-md text-foreground underline underline-offset-4 hover:text-brand",
      },
      size: {
        default: "h-10 px-5",
        xs: "h-7 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 px-3.5 text-[0.8125rem]",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-9 text-base",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
