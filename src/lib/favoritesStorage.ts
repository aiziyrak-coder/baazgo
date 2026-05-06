const KEY = "baazgo_favorites_v1";

export function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed as string[]).filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function persistFavoriteIds(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
