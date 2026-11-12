/**
 * Plain wrapper. Sections used to fade in on scroll; that's gone (content should simply be there),
 * and the hero's entrance is the only load animation.
 */
export function Reveal({ children, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return <div className={className}>{children}</div>;
}
