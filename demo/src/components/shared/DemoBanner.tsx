import { isDemoMode } from "@/lib/runtime";

export function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div
      aria-label="Public demo"
      className="relative z-[60] shrink-0 border-b bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground"
      role="status"
    >
      Public demo · Fictional data · Read-only
    </div>
  );
}
