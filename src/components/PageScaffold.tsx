import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Truck } from "lucide-react";

interface PageScaffoldProps {
  title: string;
  children: ReactNode;
}

/**
 * Simple chrome for standalone legal / info routes (no map shell).
 */
export function PageScaffold({ title, children }: PageScaffoldProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F2F2F7] text-slate-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/5 bg-white/95 px-4 py-3 pt-[max(env(safe-area-inset-top),0.75rem)] shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-slate-900 transition-colors hover:bg-black/10"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Truck className="h-5 w-5 shrink-0 text-[#0f172a]" />
          <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        </div>
        <Link
          to="/"
          className="shrink-0 text-sm font-medium text-[#007AFF] hover:underline"
        >
          Xarita
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
