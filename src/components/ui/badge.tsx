import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-4 focus-visible:ring-ring/25 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border-border text-foreground/80",
        ghost: "text-muted-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        brand: "bg-brand-soft text-brand",
        mint: "bg-tint-mint text-foreground/80",
        peach: "bg-tint-peach text-foreground/80",
        butter: "bg-tint-butter text-foreground/80",
        sky: "bg-tint-sky text-foreground/80",
        rose: "bg-tint-rose text-foreground/80",
        lavender: "bg-tint-lavender text-foreground/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
