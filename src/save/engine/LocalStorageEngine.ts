import Engine from "./Engine";

export default class LocalStorageEngine implements Engine {
  storage: Storage = null;
  constructor() {
    if (LocalStorageEngine.isSupported()) {
      this.storage = localStorage;
    } else {
      this.storage = null;
    }
  }
  static isSupported() {
    try {
      localStorage.setItem("__test", "1");
      localStorage.removeItem("__test");
      return true;
    } catch (e) {
      return false;
    }
  }
  save(key: string, value: any): void {
    if (!this.storage) return;
    this.storage.setItem(key, JSON.stringify(value));
  }
  load(key: string): any {
    if (!this.storage) null;
    const value = this.storage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (e) {
      // Invalid JSON...
      this.storage.removeItem(key);
      return null;
    }
  }
  remove(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(key);
  }
}
