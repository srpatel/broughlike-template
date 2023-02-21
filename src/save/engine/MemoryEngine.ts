import Engine from "./Engine";

export default class MemoryEngine implements Engine {
  storage = new Map();
  save(key: string, value: any): void {
    this.storage.set(key, value);
  }
  load(key: string): any {
    if (!this.storage.has(key)) return null;
    return this.storage.get(key);
  }
  remove(key: string): void {
    if (!this.storage) return;
    this.storage.delete(key);
  }
}
