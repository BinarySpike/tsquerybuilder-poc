import { executeDescriptor } from './inMemory';
import type { CacheAdapter, QueryDescriptor, StoreAdapter } from './orm.types';

// ── Shared store implementation ───────────────────────────────────────

/**
 * localStorage-backed store. Every key is namespaced with `ns` so that
 * the cache adapter and store adapter never share keys — preventing
 * cache.clear() from accidentally wiping store records.
 *
 *   store adapter keys:  store:todos:0,  store:todos:__seq
 *   cache adapter keys:  cache:todos:1
 */
class LocalStorageStore {
    constructor(private readonly _ns: string) {}

    private _key(tableName: string, id: unknown): string {
        return `${this._ns}${tableName}:${id}`;
    }

    private _prefix(tableName: string): string {
        return `${this._ns}${tableName}:`;
    }

    private *_entries(tableName: string): Iterable<[string, unknown]> {
        const prefix = this._prefix(tableName);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)!;
            if (key.startsWith(prefix)) {
                const id = key.slice(prefix.length);
                if (id === '__seq') continue;   // skip sequence counter
                const raw = localStorage.getItem(key);
                if (raw !== null) yield [id, JSON.parse(raw)];
            }
        }
    }

    get(tableName: string, id: unknown): unknown | null {
        const raw = localStorage.getItem(this._key(tableName, id));
        return raw !== null ? JSON.parse(raw) : null;
    }

    set(tableName: string, id: unknown, value: unknown): void {
        localStorage.setItem(this._key(tableName, id), JSON.stringify(value));
    }

    delete(tableName: string, id: unknown): void {
        localStorage.removeItem(this._key(tableName, id));
    }

    clear(tableName: string): void {
        const prefix = this._prefix(tableName);
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)!;
            if (key.startsWith(prefix)) toRemove.push(key);
        }
        for (const k of toRemove) localStorage.removeItem(k);
    }

    insert(tableName: string, value: unknown): void {
        const seqKey = this._key(tableName, '__seq');
        const seq = Number(localStorage.getItem(seqKey) ?? '0');
        localStorage.setItem(this._key(tableName, seq), JSON.stringify(value));
        localStorage.setItem(seqKey, String(seq + 1));
    }

    update(tableName: string, id: unknown, patch: unknown): void {
        const key = this._key(tableName, id);
        const raw = localStorage.getItem(key);
        const existing = raw !== null ? JSON.parse(raw) : null;
        if (existing !== null && typeof existing === 'object') {
            localStorage.setItem(key, JSON.stringify({ ...(existing as object), ...(patch as object) }));
        } else {
            localStorage.setItem(key, JSON.stringify(patch));
        }
    }

    query(tableName: string, descriptor: QueryDescriptor): unknown[] {
        return executeDescriptor(tableName, this._entries(tableName), descriptor);
    }
}

// ── Adapter factories ─────────────────────────────────────────────────

export function createLocalStorageCacheAdapter(): CacheAdapter {
    const store = new LocalStorageStore('cache:');
    return {
        async get(tableName, id)           { return store.get(tableName, id); },
        async set(tableName, id, value)    { store.set(tableName, id, value); },
        async delete(tableName, id)        { store.delete(tableName, id); },
        async query(tableName, descriptor) { return store.query(tableName, descriptor); },
        async clear(tableName)             { store.clear(tableName); },
    };
}

export function createLocalStorageStorageAdapter(): StoreAdapter {
    const store = new LocalStorageStore('store:');
    return {
        async find(tableName, descriptor)    { return store.query(tableName, descriptor); },
        async findOne(tableName, descriptor) { return store.query(tableName, descriptor)[0] ?? null; },
        async insert(tableName, value)       { store.insert(tableName, value); },
        async update(tableName, id, patch)   { store.update(tableName, id, patch); },
        async delete(tableName, id)          { store.delete(tableName, id); },
    };
}
