import { useSyncExternalStore } from 'react';

/** Phones & tablets — matches Tailwind lg breakpoint (strictly below `lg`). */
const QUERY = '(max-width: 1023px)';

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * True on narrow viewports (mobile / tablet portrait). Used to reduce map markers,
 * disable expensive blur layers, and simplify Leaflet clustering animations.
 */
export function useIsNarrowViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
