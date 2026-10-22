import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * Chunky, tactile buttons in the Duolingo spirit: a solid "ledge" underneath
 * (--btn-shade) that the button presses down into when tapped.
 * Override the ledge colour on a custom background with [--btn-shade:...].
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-transparent text-sm font-bold tracking-wide whitespace-nowrap uppercase transition-[transform,box-shadow,filter,background-color] duration-100 outline-none select-none shadow-[0_4px_0_var(--btn-shade)] [--btn-shade:transparent] focus-visible:ring-4 focus-visible:ring-ring/30 active:translate-y-[4px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [--btn-shade:#0f0066] hover:brightness-110",
        brand: "bg-brand text-brand-foreground [--btn-shade:#0b2c86] hover:brightness-110",
        outline:
          "border-border bg-card text-foreground [--btn-shade:var(--border)] hover:bg-muted aria-expanded:bg-muted",
        soft: "bg-brand-soft text-brand [--btn-shade:#c3d1f7] hover:brightness-[0.98]",
        secondary: "bg-secondary text-secondary-foreground [--btn-shade:var(--input)] hover:bg-accent",
        ghost:
          "text-foreground/80 shadow-none hover:bg-muted hover:text-foreground active:translate-y-0 aria-expanded:bg-muted",
        destructive: "bg-destructive/10 text-destructive [--btn-shade:rgb(200_64_46/0.25)] hover:bg-destructive/18",
        link: "rounded-md text-foreground normal-case underline underline-offset-4 shadow-none hover:text-brand active:translate-y-0",
      },
      size: {
        default: "h-11 px-5",
        xs: "h-7 rounded-xl px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-xl px-3.5 text-xs",
        lg: "h-12 px-7 text-[0.95rem]",
        xl: "h-14 px-9 text-base",
        icon: "size-11",
        "icon-xs": "size-7 rounded-xl",
        "icon-sm": "size-9 rounded-xl",
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
