// Global test setup - creates jsdom DOM environment for @testing-library/react

import { afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';
import 'fake-indexeddb/auto';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
});

const { window } = dom;

const requiredGlobals: Record<string, any> = {
  document: window.document,
  window: window,
  navigator: window.navigator,
  global: window,
  HTMLElement: window.HTMLElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLButtonElement: window.HTMLButtonElement,
  HTMLTableElement: window.HTMLTableElement,
  HTMLTableRowElement: window.HTMLTableRowElement,
  HTMLTableCellElement: window.HTMLTableCellElement,
  HTMLSelectElement: window.HTMLSelectElement,
  HTMLIFrameElement: window.HTMLIFrameElement,
  HTMLDivElement: window.HTMLDivElement,
  HTMLSpanElement: window.HTMLSpanElement,
  HTMLParagraphElement: window.HTMLParagraphElement,
  HTMLHeadingElement: window.HTMLHeadingElement,
  Node: window.Node,
  DocumentFragment: window.DocumentFragment,
  Event: window.Event,
  KeyboardEvent: window.KeyboardEvent,
  MouseEvent: window.MouseEvent,
  CustomEvent: window.CustomEvent,
  MutationObserver: window.MutationObserver,
  DOMRect: window.DOMRect,
};

for (const [key, value] of Object.entries(requiredGlobals)) {
  try {
    if (!(key in globalThis)) {
      Object.defineProperty(globalThis, key, {
        value,
        writable: true,
        configurable: true,
      });
    }
  } catch {
    // Skip properties that can't be defined
  }
}

(globalThis as any).__ZUSTAND_RESET_STORES__ = [];

const storage: Record<string, string> = {};
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index: number) => Object.keys(storage)[index] ?? null,
  },
  writable: true,
  configurable: true,
});

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        }),
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
      },
    },
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  while (window.document.body.firstChild) {
    window.document.body.removeChild(window.document.body.firstChild);
  }

  const resetStores = (globalThis as any).__ZUSTAND_RESET_STORES__;
  if (Array.isArray(resetStores)) {
    for (const reset of resetStores) {
      try {
        reset();
      } catch {}
    }
  }
});
