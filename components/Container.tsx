// Same width and gutter as the hero, so every section lines up with it.
export default function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>;
}
