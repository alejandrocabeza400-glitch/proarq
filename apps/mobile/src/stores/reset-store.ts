// Global store reset registry
// This is stored on globalThis so the test setup can find it
if (typeof globalThis !== 'undefined') {
  if (!(globalThis as any).__ZUSTAND_RESET_STORES__) {
    (globalThis as any).__ZUSTAND_RESET_STORES__ = [];
  }
}

export function registerResetStore(resetFn: () => void): void {
  if (typeof globalThis !== 'undefined') {
    const registry = (globalThis as any).__ZUSTAND_RESET_STORES__;
    if (registry) {
      registry.push(resetFn);
    }
  }
}
