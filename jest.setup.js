if (globalThis.__NATIVE_GLOBALS__) {
  for (const [key, value] of Object.entries(globalThis.__NATIVE_GLOBALS__)) {
    if (value !== undefined) {
      Object.defineProperty(globalThis, key, {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
  }
}
