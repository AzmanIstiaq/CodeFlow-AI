export type HistoryAvailability = {
  canUndo: boolean;
  canRedo: boolean;
};

type HistoryEntry<T> = {
  value: T;
  serialized: string;
};

type HistoryScope<T> = {
  entries: HistoryEntry<T>[];
  index: number;
};

const EMPTY_AVAILABILITY: HistoryAvailability = {
  canUndo: false,
  canRedo: false,
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Small external store used by the React history hook and unit tests.
 * Each page key owns an independent stack so switching pages cannot restore
 * another page's nodes.
 */
export class HistoryStore<T> {
  private readonly scopes = new Map<string, HistoryScope<T>>();
  private readonly listeners = new Set<() => void>();
  private activeKey: string | null = null;
  private snapshot: HistoryAvailability = EMPTY_AVAILABILITY;
  private readonly limit: number;

  constructor(limit = 50) {
    this.limit = limit;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  record(key: string, value: T) {
    this.activeKey = key;
    const serialized = JSON.stringify(value);
    const scope = this.scopes.get(key) ?? { entries: [], index: -1 };
    const current = scope.entries[scope.index];

    if (current?.serialized !== serialized) {
      scope.entries = scope.entries.slice(0, scope.index + 1);
      scope.entries.push({ value: clone(value), serialized });

      if (scope.entries.length > this.limit) {
        scope.entries.shift();
      }

      scope.index = scope.entries.length - 1;
      this.scopes.set(key, scope);
    }

    this.publish(scope);
  }

  undo(): T | null {
    const scope = this.getActiveScope();
    if (!scope || scope.index <= 0) return null;

    scope.index -= 1;
    this.publish(scope);
    return clone(scope.entries[scope.index].value);
  }

  redo(): T | null {
    const scope = this.getActiveScope();
    if (!scope || scope.index >= scope.entries.length - 1) return null;

    scope.index += 1;
    this.publish(scope);
    return clone(scope.entries[scope.index].value);
  }

  private getActiveScope() {
    return this.activeKey ? this.scopes.get(this.activeKey) : undefined;
  }

  private publish(scope: HistoryScope<T>) {
    const next = {
      canUndo: scope.index > 0,
      canRedo: scope.index >= 0 && scope.index < scope.entries.length - 1,
    };

    if (
      next.canUndo === this.snapshot.canUndo &&
      next.canRedo === this.snapshot.canRedo
    ) {
      return;
    }

    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }
}
