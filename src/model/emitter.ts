export interface Emitter {
  emit<T>(event: string, payload?: T): void;
}
