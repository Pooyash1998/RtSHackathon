import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-6 flex-none", className)}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="28" height="28" rx="7" fill="hsl(var(--primary))" />
      <path
        d="M10 9.5H22M10 16H19M10 22.5H22M10 9.5V22.5"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandWordmark({ role, className }: { role?: "Teacher" | "Student"; className?: string }) {
  return (
    <span className={cn("flex flex-col text-lg leading-none", className)}>
      <span className="font-serif font-semibold tracking-[-0.02em] text-foreground">EduComic</span>
      {role && (
        <span className="mt-1 font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
          {role}
        </span>
      )}
    </span>
  );
}
