import { executeDescriptor } from './inMemory';
import type { CacheAdapter, QueryDescriptor, StoreAdapter } from './orm.types';

// ── Shared store implementation ───────────────────────────────────────

class LocalStorageStore {
    private _prefix(tableName: string): string {
        return `${tableName}:`;
    }

    private *_entries(tableName: string): Iterable<[string, unknown]> {
        const prefix = this._prefix(tableName);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)!;
            if (key.startsWith(prefix)) {
                const raw = localStorage.getItem(key);
                if (raw !== null) yield [key.slice(prefix.length), JSON.parse(raw)];
            }
        }
    }

    get(tableName: string, id: unknown): unknown | null {
        const raw = localStorage.getItem(`${tableName}:${id}`);
        return raw !== null ? JSON.parse(raw) : null;
    }

    set(tableName: string, id: unknown, value: unknown): void {
        localStorage.setItem(`${tableName}:${id}`, JSON.stringify(value));
    }

    delete(tableName: string, id: unknown): void {
        localStorage.removeItem(`${tableName}:${id}`);
    }

    clear(tableName: string): void {
        const prefix = this._prefix(tableName);
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)!;
            if (key.startsWith(prefix)) toRemove.push(key);
        }
        for (const k of toRemove) localStorage.removeItem(k);
        localStorage.removeItem(`topheavy:${tableName}:__seq`);
    }

    insert(tableName: string, value: unknown): void {
        const seqKey = `topheavy:${tableName}:__seq`;
        const seq = Number(localStorage.getItem(seqKey) ?? '0');
        localStorage.setItem(`${tableName}:${seq}`, JSON.stringify(value));
        localStorage.setItem(seqKey, String(seq + 1));
    }

    update(tableName: string, id: unknown, patch: unknown): void {
        const key = `${tableName}:${id}`;
        const raw = localStorage.getItem(key);
        const existing = raw !== null ? JSON.parse(raw) : null;
        if (existing !== null && typeof existing === 'object') {
            localStorage.setItem(key, JSON.stringify({ ...(existing as object), ...(patch as object) }));
        } else {
            localStorage.setItem(key, JSON.stringify(patch));
        }
    }

    query(tableName: string, descriptor: QueryDescriptor): unknown[] {
        return executeDescriptor(this._entries(tableName), descriptor);
    }
}

// ── Adapter factories ─────────────────────────────────────────────────

export function createLocalStorageCacheAdapter(): CacheAdapter {
    const store = new LocalStorageStore();
    return {
        async get(tableName, id)           { return store.get(tableName, id); },
        async set(tableName, id, value)    { store.set(tableName, id, value); },
        async delete(tableName, id)        { store.delete(tableName, id); },
        async query(tableName, descriptor) { return store.query(tableName, descriptor); },
        async clear(tableName)             { store.clear(tableName); },
    };
}

export function createLocalStorageStorageAdapter(): StoreAdapter {
    const store = new LocalStorageStore();
    return {
        async find(tableName, descriptor)    { return store.query(tableName, descriptor); },
        async findOne(tableName, descriptor) { return store.query(tableName, descriptor)[0] ?? null; },
        async insert(tableName, value)       { store.insert(tableName, value); },
        async update(tableName, id, patch)   { store.update(tableName, id, patch); },
        async delete(tableName, id)          { store.delete(tableName, id); },
    };
}
