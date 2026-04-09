import { evaluateConditions } from './orm';
import type { AggregateDescriptor, CacheAdapter, QueryDescriptor, StoreAdapter } from './orm.types';

// ── Helpers ───────────────────────────────────────────────────────────

function getValueAtPath(record: unknown, path: string): unknown {
    return path.split('.').reduce((obj: any, key) => obj?.[key], record);
}

function projectRecord(record: unknown, select: '*' | string[]): unknown {
    if (select === '*') return record;
    const result: Record<string, unknown> = {};
    for (const path of select) {
        result[path] = getValueAtPath(record, path);
    }
    return result;
}

function applyOrderBy(records: unknown[], orderBy: NonNullable<QueryDescriptor['orderBy']>): unknown[] {
    return [...records].sort((a, b) => {
        for (const { path, direction } of orderBy) {
            const av = getValueAtPath(a, path);
            const bv = getValueAtPath(b, path);
            if (av === bv) continue;
            const cmp = av! < bv! ? -1 : 1;
            return direction === 'asc' ? cmp : -cmp;
        }
        return 0;
    });
}

function applyAggregate(records: unknown[], agg: AggregateDescriptor): unknown {
    switch (agg.type) {
        case 'count':
            return records.length;
        case 'countDistinct': {
            const seen = new Set(records.map(r => getValueAtPath(r, agg.path)));
            return seen.size;
        }
        case 'sum':
            return records.reduce((acc: number, r) => acc + (getValueAtPath(r, agg.path) as number), 0);
        case 'avg': {
            if (records.length === 0) return null;
            const sum = records.reduce((acc: number, r) => acc + (getValueAtPath(r, agg.path) as number), 0);
            return (sum as number) / records.length;
        }
        case 'min':
            return records.reduce((acc: unknown, r) => {
                const v = getValueAtPath(r, agg.path);
                return acc === undefined || v! < acc! ? v : acc;
            }, undefined);
        case 'max':
            return records.reduce((acc: unknown, r) => {
                const v = getValueAtPath(r, agg.path);
                return acc === undefined || v! > acc! ? v : acc;
            }, undefined);
        case 'distinct':
            return [...new Set(records.map(r => getValueAtPath(r, agg.path)))];
    }
}

/**
 * Filters, orders, aggregates, and projects records.
 * Accepts Map entries so that the store key can be stamped onto each record
 * as non-enumerable `$id` and `$table` properties before projection.
 * Both are invisible to JSON.stringify / spread / schema validation.
 */
export function executeDescriptor(tableName: string, entries: Iterable<[string, unknown]>, descriptor: QueryDescriptor): unknown[] {
    // 1. Filter and stamp $id + $table
    let results: unknown[] = [];
    for (const [key, record] of entries) {
        if (evaluateConditions(record, descriptor.conditions)) {
            Object.defineProperty(record as object, '$id', {
                value: key,
                enumerable: false,
                configurable: true,
                writable: false,
            });
            Object.defineProperty(record as object, '$table', {
                value: tableName,
                enumerable: false,
                configurable: true,
                writable: false,
            });
            results.push(record);
        }
    }

    // 2. Order
    if (descriptor.orderBy && descriptor.orderBy.length > 0) {
        results = applyOrderBy(results, descriptor.orderBy);
    }

    // 3. Aggregate (returns a single-element array wrapping the scalar/array result)
    if (descriptor.aggregate) {
        return [applyAggregate(results, descriptor.aggregate)];
    }

    // 4. Project
    return results.map(r => projectRecord(r, descriptor.select));
}

// ── Shared store implementation ───────────────────────────────────────

class MemoryStore {
    private readonly _tables = new Map<string, Map<string, unknown>>();

    private _getTable(tableName: string): Map<string, unknown> {
        let table = this._tables.get(tableName);
        if (!table) {
            table = new Map();
            this._tables.set(tableName, table);
        }
        return table;
    }

    get(tableName: string, id: unknown): unknown | null {
        return this._getTable(tableName).get(String(id)) ?? null;
    }

    set(tableName: string, id: unknown, value: unknown): void {
        this._getTable(tableName).set(String(id), value);
    }

    delete(tableName: string, id: unknown): void {
        this._getTable(tableName).delete(String(id));
    }

    clear(tableName: string): void {
        this._getTable(tableName).clear();
    }

    insert(tableName: string, value: unknown): void {
        const table = this._getTable(tableName);
        table.set(String(table.size), value);
    }

    update(tableName: string, id: unknown, patch: unknown): void {
        const table = this._getTable(tableName);
        const existing = table.get(String(id));
        if (existing !== undefined && typeof existing === 'object' && existing !== null) {
            // Create a new merged object so that the original stored reference is
            // not mutated (avoids poisoning shared fixture objects in tests and
            // prevents observable-slim observers from firing unexpectedly).
            table.set(String(id), { ...(existing as object), ...(patch as object) });
        } else {
            table.set(String(id), patch);
        }
    }

    query(tableName: string, descriptor: QueryDescriptor): unknown[] {
        return executeDescriptor(tableName, this._getTable(tableName).entries(), descriptor);
    }
}

// ── Adapter factories ─────────────────────────────────────────────────

export function createMemoryCacheAdapter(): CacheAdapter {
    const store = new MemoryStore();
    return {
        async get(tableName, id) { return store.get(tableName, id); },
        async set(tableName, id, value) { store.set(tableName, id, value); },
        async delete(tableName, id) { store.delete(tableName, id); },
        async query(tableName, descriptor) { return store.query(tableName, descriptor); },
        async clear(tableName) { store.clear(tableName); },
    };
}

export function createMemoryStoreAdapter(): StoreAdapter {
    const store = new MemoryStore();
    return {
        async find(tableName, descriptor) { return store.query(tableName, descriptor); },
        async findOne(tableName, descriptor) { return store.query(tableName, descriptor)[0] ?? null; },
        async insert(tableName, value) { store.insert(tableName, value); },
        async update(tableName, id, patch) { store.update(tableName, id, patch); },
        async delete(tableName, id) { store.delete(tableName, id); },
    };
}
