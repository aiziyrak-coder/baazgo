import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Catches React render errors so the whole SPA does not go blank without feedback.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 bg-[#F2F2F7] text-slate-900">
          <p className="font-semibold text-center">Nimadir xato ketdi. Iltimos, sahifani yangilang.</p>
          <button
            type="button"
            onClick={() => globalThis.location.reload()}
            className="rounded-xl bg-[#0f172a] text-white px-5 py-2.5 text-sm font-medium"
          >
            Qayta yuklash
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
