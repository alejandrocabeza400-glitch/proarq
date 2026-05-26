// Shared test helpers

export function resetMocks(): void {
  // Clear the global sessionStorage
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  } catch {
    // sessionStorage not available
  }
}

// Re-export for compatibility with test files that import mockStorage
export const mockStorage = {
  getItem: (key: string) => {
    try {
      return sessionStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      sessionStorage?.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      sessionStorage?.removeItem(key);
    } catch {}
  },
  clear: () => {
    try {
      sessionStorage?.clear();
    } catch {}
  },
  get length() {
    try {
      return sessionStorage?.length ?? 0;
    } catch {
      return 0;
    }
  },
  key: (index: number) => {
    try {
      return sessionStorage?.key(index) ?? null;
    } catch {
      return null;
    }
  },
};
