export default interface Engine {
  save(key: string, value: any): void;
  load(key: string): any;
  remove(key: string): void;
}
