// Minimal DOM mock for @testing-library/react compatibility

class MockNode {
  nodeType = 1;
  nodeName = 'DIV';
  parentNode: any = null;
  parentElement: any = null;
  childNodes: any[] = [];
  firstChild: any = null;
  lastChild: any = null;
  nextSibling: any = null;
  previousSibling: any = null;
  textContent = '';
  _attributes: Record<string, string> = {};

  appendChild(child: any) {
    this.childNodes.push(child);
    child.parentNode = this;
    child.parentElement = this;
    this.lastChild = child;
    if (!this.firstChild) this.firstChild = child;
    return child;
  }

  removeChild(child: any) {
    const idx = this.childNodes.indexOf(child);
    if (idx >= 0) {
      this.childNodes.splice(idx, 1);
      child.parentNode = null;
      child.parentElement = null;
    }
    return child;
  }

  insertBefore(newChild: any, refChild: any) {
    const idx = refChild ? this.childNodes.indexOf(refChild) : -1;
    if (idx >= 0) {
      this.childNodes.splice(idx, 0, newChild);
    } else {
      this.childNodes.push(newChild);
    }
    newChild.parentNode = this;
    newChild.parentElement = this;
    return newChild;
  }

  replaceChild(newChild: any, oldChild: any) {
    const idx = this.childNodes.indexOf(oldChild);
    if (idx >= 0) {
      this.childNodes[idx] = newChild;
      newChild.parentNode = this;
      newChild.parentElement = this;
    }
    return oldChild;
  }

  contains(child: any) {
    return this.childNodes.includes(child);
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
  focus() {}
  blur() {}

  setAttribute(name: string, value: string) {
    // Normalize style specially
    if (name === 'style' && typeof value === 'string') {
      this._cssText = value;
    }
    this._attributes[name] = String(value);
  }

  getAttribute(name: string) {
    return this._attributes[name] ?? null;
  }

  hasAttribute(name: string) {
    return name in this._attributes;
  }

  removeAttribute(name: string) {
    delete this._attributes[name];
  }

  closest() {
    return null;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  getElementsByClassName() {
    return [];
  }
  getElementsByTagName() {
    return [];
  }
}

class MockElement extends MockNode {
  tagName = 'DIV';
  className = '';
  id = '';
  innerHTML = '';
  _style: Record<string, string> = {};
  _cssText = '';
  _dataset: Record<string, string> = {};
  _listeners: Record<string, Function[]> = {};
  _value = '';
  _checked = false;
  _disabled = false;
  scrollTop = 0;
  scrollLeft = 0;
  offsetHeight = 0;
  offsetWidth = 0;
  children: MockElement[] = [];

  constructor(tag = 'div') {
    super();
    this.tagName = tag.toUpperCase();
    this.nodeName = this.tagName;
  }

  get style() {
    const self = this;
    return new Proxy(this._style, {
      get(target, prop) {
        if (prop === 'cssText') return self._cssText;
        return target[prop as string] || '';
      },
      set(target, prop, value) {
        if (prop === 'cssText') {
          self._cssText = value;
          return true;
        }
        target[prop as string] = value;
        return true;
      },
    });
  }

  get value() {
    return this._value;
  }
  set value(v: string) {
    this._value = v;
  }

  get disabled() {
    return this._disabled;
  }
  set disabled(v: boolean) {
    this._disabled = v;
  }

  get dataset() {
    return this._dataset;
  }

  getAttribute(name: string) {
    if (name === 'style') return this._cssText || null;
    if (name === 'value') return this._value || null;
    if (name === 'disabled') return this._disabled ? '' : null;
    return this._attributes[name] ?? null;
  }

  setAttribute(name: string, value: string) {
    if (name === 'style') {
      this._cssText = value;
    } else if (name === 'value') {
      this._value = value;
    } else if (name === 'disabled') {
      this._disabled = value !== null && value !== undefined && value !== false;
    } else if (name === 'class') {
      this.className = value;
    }
    this._attributes[name] = String(value);
  }

  override appendChild(child: any) {
    if (child instanceof MockElement) {
      this.children.push(child);
    }
    return super.appendChild(child);
  }

  override removeChild(child: any) {
    if (child instanceof MockElement) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
    }
    return super.removeChild(child);
  }

  addEventListener(type: string, handler: Function) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(handler);
  }

  removeEventListener(type: string, handler: Function) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter((h) => h !== handler);
  }

  dispatchEvent(event: any) {
    const handlers = this._listeners[event.type] || [];
    for (const handler of handlers) {
      handler(event);
    }
    // Bubble up
    if (this.parentElement) {
      this.parentElement.dispatchEvent(event);
    }
    return true;
  }

  getBoundingClientRect() {
    return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, x: 0, y: 0 };
  }
}

class MockDocument {
  body: MockElement;
  documentElement: MockElement;
  head: MockElement;
  defaultView: any = null;
  readyState = 'complete';
  cookie = '';
  referrer = '';
  title = '';
  URL = 'http://localhost:3000';
  documentURI = 'http://localhost:3000';
  compatMode = 'CSS1Compat';
  characterSet = 'UTF-8';
  contentType = 'text/html';
  hidden = false;
  visibilityState = 'visible';
  _listeners: Record<string, Function[]> = {};

  constructor() {
    this.body = new MockElement('body');
    this.documentElement = new MockElement('html');
    this.head = new MockElement('head');
    this.defaultView = {
      document: this,
      innerWidth: 1024,
      innerHeight: 768,
      scrollX: 0,
      scrollY: 0,
      pageXOffset: 0,
      pageYOffset: 0,
      screenX: 0,
      screenY: 0,
      outerWidth: 1024,
      outerHeight: 768,
      devicePixelRatio: 1,
    };
  }

  createElement(tag: string) {
    return new MockElement(tag);
  }

  createTextNode(text: string) {
    const node = new MockNode();
    node.nodeType = 3;
    node.nodeName = '#text';
    node.textContent = text;
    return node;
  }

  createComment() {
    const node = new MockNode();
    node.nodeType = 8;
    node.nodeName = '#comment';
    return node;
  }

  createDocumentFragment() {
    const frag = new MockNode();
    frag.nodeType = 11;
    frag.nodeName = '#document-fragment';
    return frag;
  }

  createEvent(type: string) {
    return { type, initEvent: () => {} };
  }

  createRange() {
    return {
      setStart: () => {},
      setEnd: () => {},
      commonAncestorContainer: { nodeType: 1, textContent: '' },
      getBoundingClientRect: () => ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }),
    };
  }

  getElementById(_id: string) {
    return null;
  }
  getElementsByClassName(_className: string) {
    return [];
  }
  getElementsByTagName(_tagName: string) {
    return [];
  }
  querySelector(_selector: string) {
    return null;
  }
  querySelectorAll(_selector: string) {
    return [];
  }

  addEventListener(type: string, handler: Function) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(handler);
  }

  removeEventListener(type: string, handler: Function) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter((h) => h !== handler);
  }

  dispatchEvent(event: any) {
    const handlers = this._listeners[event.type] || [];
    for (const handler of handlers) {
      handler(event);
    }
    return true;
  }

  write() {}
  writeln() {}
  open() {
    return this;
  }
  close() {}
  hasFocus() {
    return true;
  }
  hasStorageAccess() {
    return Promise.resolve(true);
  }
}

const doc = new MockDocument();

// Set up globalThis
Object.defineProperties(globalThis, {
  document: { value: doc, writable: true, configurable: true },
  window: {
    value: doc.defaultView,
    writable: true,
    configurable: true,
  },
  navigator: {
    value: {
      userAgent: 'Bun Test',
      platform: 'Bun',
      language: 'en-US',
      cookieEnabled: true,
      onLine: true,
    },
    writable: true,
    configurable: true,
  },
  Element: { value: MockElement, writable: true, configurable: true },
  HTMLElement: { value: MockElement, writable: true, configurable: true },
  HTMLInputElement: { value: MockElement, writable: true, configurable: true },
  HTMLButtonElement: { value: MockElement, writable: true, configurable: true },
  HTMLTableElement: { value: MockElement, writable: true, configurable: true },
  HTMLTableRowElement: { value: MockElement, writable: true, configurable: true },
  HTMLTableCellElement: { value: MockElement, writable: true, configurable: true },
  HTMLSelectElement: { value: MockElement, writable: true, configurable: true },
  HTMLIFrameElement: { value: MockElement, writable: true, configurable: true },
  HTMLDivElement: { value: MockElement, writable: true, configurable: true },
  HTMLSpanElement: { value: MockElement, writable: true, configurable: true },
  HTMLParagraphElement: { value: MockElement, writable: true, configurable: true },
  HTMLHeadingElement: { value: MockElement, writable: true, configurable: true },
  Node: { value: MockNode, writable: true, configurable: true },
  Event: {
    value: class MockEvent {
      type: string;
      bubbles = false;
      cancelable = false;
      defaultPrevented = false;
      target: any = null;
      currentTarget: any = null;
      constructor(type: string, opts?: any) {
        this.type = type;
        if (opts) {
          this.bubbles = opts.bubbles || false;
          this.cancelable = opts.cancelable || false;
        }
      }
      preventDefault() {
        this.defaultPrevented = true;
      }
      stopPropagation() {}
      stopImmediatePropagation() {}
    },
    writable: true,
    configurable: true,
  },
  KeyboardEvent: {
    value: class MockKeyboardEvent {
      type: string;
      key: string;
      code: string;
      ctrlKey = false;
      shiftKey = false;
      altKey = false;
      metaKey = false;
      constructor(type: string, opts?: any) {
        this.type = type;
        if (opts) {
          this.key = opts.key || '';
          this.code = opts.code || '';
        }
      }
      preventDefault() {}
      stopPropagation() {}
    },
    writable: true,
    configurable: true,
  },
  MouseEvent: {
    value: class MockMouseEvent {
      type: string;
      clientX = 0;
      clientY = 0;
      button = 0;
      constructor(type: string, opts?: any) {
        this.type = type;
        Object.assign(this, opts);
      }
      preventDefault() {}
      stopPropagation() {}
    },
    writable: true,
    configurable: true,
  },
  CustomEvent: {
    value: class MockCustomEvent {
      type: string;
      detail: any;
      constructor(type: string, opts?: any) {
        this.type = type;
        this.detail = opts?.detail;
      }
    },
    writable: true,
    configurable: true,
  },
  MutationObserver: {
    value: class MockMutationObserver {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
    writable: true,
    configurable: true,
  },
  DOMRect: {
    value: class MockDOMRect {
      x = 0;
      y = 0;
      width = 0;
      height = 0;
      top = 0;
      right = 0;
      bottom = 0;
      left = 0;
    },
    writable: true,
    configurable: true,
  },
});

// Session storage mock
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

// Crypto mock
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
