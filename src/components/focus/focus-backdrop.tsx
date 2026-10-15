/**
 * Three slow, soft colour washes behind Focus Mode. Pure CSS (no JavaScript),
 * and so quiet you only notice them when they're gone.
 */
export function FocusBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-28 -left-24 size-72 animate-float-slow rounded-full bg-tint-lavender opacity-80 blur-3xl sm:size-[28rem]" />
      <div className="absolute top-1/3 -right-28 size-72 animate-float-slow rounded-full bg-tint-peach opacity-70 blur-3xl [animation-delay:-4s] sm:size-[30rem]" />
      <div className="absolute -bottom-32 left-1/4 size-72 animate-float-slow rounded-full bg-tint-mint opacity-70 blur-3xl [animation-delay:-8s] sm:size-[26rem]" />
    </div>
  );
}
