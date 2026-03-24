let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export function runUnauthorizedHandler() {
  onUnauthorized?.();
}
