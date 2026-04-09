import ObservableSlim from 'observable-slim';
import { QueryBuilderImpl, AggregateSelectorImpl } from '@topheavy/query';
import type { QueryConditions, QueryConditionGroup, QueryConditionLeaf } from '@topheavy/query';
import type { TypeDefinition } from '@topheavy/schema';
import type {
    CacheAdapter,
    StoreAdapter,
    DatabaseOptions,
    TableType,
    RepositoryItem,
    OrmQueryBuilder,
    QueryDescriptor,
} from './orm.types';

// ── Condition evaluator ───────────────────────────────────────────────

function getValueAtPath(record: unknown, path: string): unknown {
    return path.split('.').reduce((obj: any, key) => obj?.[key], record);
}

function isLeaf(item: QueryConditionLeaf | QueryConditionGroup | 'and' | 'or'): item is QueryConditionLeaf {
    return Array.isArray(item) && item.length === 3 && typeof item[0] === 'string' && typeof item[1] === 'string';
}

function evaluateLeaf(record: unknown, [path, operator, value]: QueryConditionLeaf): boolean {
    const v = getValueAtPath(record, path);
    switch (operator) {
        case 'is': return v === value;
        case 'not.is': return v !== value;
        case 'in': return Array.isArray(value) && (value as unknown[]).includes(v);
        case 'not.in': return Array.isArray(value) && !(value as unknown[]).includes(v);
        case 'contains': return typeof v === 'string' && v.includes(value as string);
        case 'not.contains': return typeof v === 'string' && !v.includes(value as string);
        case 'beginsWith': return typeof v === 'string' && v.startsWith(value as string);
        case 'not.beginsWith': return typeof v === 'string' && !v.startsWith(value as string);
        case 'endsWith': return typeof v === 'string' && v.endsWith(value as string);
        case 'not.endsWith': return typeof v === 'string' && !v.endsWith(value as string);
        case 'greaterThan': return typeof v === 'number' && v > (value as number);
        case 'not.greaterThan': return typeof v === 'number' && !(v > (value as number));
        case 'lessThan': return typeof v === 'number' && v < (value as number);
        case 'not.lessThan': return typeof v === 'number' && !(v < (value as number));
        case 'between': {
            const [min, max] = value as [unknown, unknown];
            if (typeof v === 'number') return v >= (min as number) && v <= (max as number);
            if (v instanceof Date) return v >= (min as Date) && v <= (max as Date);
            return false;
        }
        case 'before': return v instanceof Date && v < (value as Date);
        case 'after': return v instanceof Date && v > (value as Date);
        case 'has': return Array.isArray(v) && v.includes(value);
        case 'hasSome': return Array.isArray(v) && Array.isArray(value) && (value as unknown[]).some(val => v.includes(val));
        case 'hasEvery': return Array.isArray(v) && Array.isArray(value) && (value as unknown[]).every(val => v.includes(val));
        default: return false;
    }
}

function evaluateGroup(record: unknown, group: QueryConditionGroup): boolean {
    let result = true;
    let nextOp: 'and' | 'or' = 'and';
    let first = true;

    for (const item of group) {
        if (item === 'and') { nextOp = 'and'; continue; }
        if (item === 'or') { nextOp = 'or'; continue; }

        const itemResult = isLeaf(item)
            ? evaluateLeaf(record, item)
            : evaluateGroup(record, item);

        if (first) { result = itemResult; first = false; }
        else result = nextOp === 'and' ? result && itemResult : result || itemResult;
        nextOp = 'and';
    }

    return first ? true : result;
}

export function evaluateConditions(record: unknown, conditions: QueryConditions): boolean {
    if (conditions.length === 0) return true;

    let result = true;
    let nextOp: 'and' | 'or' = 'and';
    let first = true;

    for (const item of conditions) {
        if (item === 'and') { nextOp = 'and'; continue; }
        if (item === 'or') { nextOp = 'or'; continue; }

        const itemResult = evaluateGroup(record, item);

        if (first) { result = itemResult; first = false; }
        else result = nextOp === 'and' ? result && itemResult : result || itemResult;
        nextOp = 'and';
    }

    return result;
}

// ── ORM query builder ─────────────────────────────────────────────────

/**
 * Extends QueryBuilderImpl directly — inherits all condition/chain methods.
 * Overrides selectAll/select to capture the descriptor and return `this` so
 * the chain remains awaitable. then() builds a default descriptor if neither
 * was called.
 *
 * _isAggregate tracks whether an aggregate callback was passed to select(),
 * so _execute knows whether to cast the result as MutableResult or a plain array.
 */
class OrmQueryBuilderImpl<T> extends QueryBuilderImpl implements OrmQueryBuilder<T> {
    private _descriptor: QueryDescriptor | null = null;
    private _isAggregate = false;

    constructor(
        private readonly _db: Database<any>,
        private readonly _tableName: string,
    ) {
        super();
    }

    override selectAll(): any {
        this._isAggregate = false;
        this._descriptor = {
            conditions: this.getConditions(),
            select: '*',
            ...(this._orderBys.length > 0 && { orderBy: [...this._orderBys] }),
        };
        return this;
    }

    override select(...args: unknown[]): any {
        const lastArg = args[args.length - 1];
        let paths: string[];
        let aggregate: unknown;

        if (typeof lastArg === 'function') {
            paths = args.slice(0, -1) as string[];
            aggregate = (lastArg as Function)(new (AggregateSelectorImpl as any)());
            this._isAggregate = true;
        } else {
            paths = args as string[];
            this._isAggregate = false;
        }

        this._descriptor = {
            conditions: this.getConditions(),
            select: paths.length > 0 ? paths : '*',
            ...(aggregate !== undefined && { aggregate: aggregate as any }),
            ...(this._orderBys.length > 0 && { orderBy: [...this._orderBys] }),
        };
        return this;
    }

    private _buildDescriptor(): QueryDescriptor {
        if (this._descriptor) return this._descriptor;
        return {
            conditions: this.getConditions(),
            select: '*',
            ...(this._orderBys.length > 0 && { orderBy: [...this._orderBys] }),
        };
    }

    then<TResult1 = RepositoryItem<T>[], TResult2 = never>(
        onFulfilled?: ((value: RepositoryItem<T>[]) => TResult1 | PromiseLike<TResult1>) | null,
        onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return this._db._execute<T>(this._tableName, this._buildDescriptor(), this._isAggregate).then(onFulfilled as any, onRejected) as any;
    }
}

// ── Database ──────────────────────────────────────────────────────────

export class Database<Tables extends Record<string, TypeDefinition<any, any>>> {
    private readonly _cache: CacheAdapter;
    private readonly _store: StoreAdapter;
    private readonly _reactive: boolean;
    /** Maps any proxy returned by _execute (reactive or readonly) → its raw underlying record. */
    private readonly _proxyRaws = new WeakMap<object, object>();
    /** Maps reactive proxies → a mutable pause-state cell used to silence the handler during Transaction. */
    private readonly _reactiveEntries = new WeakMap<object, { paused: boolean }>();

    constructor(options: DatabaseOptions<Tables>) {
        this._cache    = options.cache;
        this._store    = options.store;
        this._reactive = options.reactive ?? false;
    }

    query<K extends keyof Tables & string>(tableName: K): OrmQueryBuilder<TableType<Tables, K>> {
        return new OrmQueryBuilderImpl<TableType<Tables, K>>(this as any, tableName) as any;
    }

    async insert<K extends keyof Tables & string>(
        tableName: K,
        record: TableType<Tables, K>,
    ): Promise<void> {
        await this._store.insert(tableName, record);
        await this._cache.clear(tableName);
    }

    async delete<T>(record: RepositoryItem<T>): Promise<void> {
        await this._store.delete(record.$table, record.$id);
        await this._cache.clear(record.$table);
    }

    /**
     * Single-record form: wraps one query result in an ObservableSlim proxy,
     * runs `mutator` with it, then flushes a differential update to the store.
     * On failure the in-memory object is restored from a snapshot.
     *
     * The record must have been returned by `db.query()` so that `$id` and
     * `$table` are present on it.
     */
    async Transaction<T extends object>(record: RepositoryItem<T>, mutator: (record: RepositoryItem<T>) => void): Promise<void>;
    /**
     * Batch form: wraps each record in an ObservableSlim proxy, runs `mutator`,
     * then flushes one differential update per changed record to the store.
     * On any store failure all in-memory mutations are reverted and the error is re-thrown.
     */
    async Transaction<T extends object>(results: RepositoryItem<T>[], mutator: (records: RepositoryItem<T>[]) => void): Promise<void>;
    async Transaction<T extends object>(
        target: RepositoryItem<T> | RepositoryItem<T>[],
        mutator: ((record: RepositoryItem<T>) => void) | ((records: RepositoryItem<T>[]) => void),
    ): Promise<void> {
        if (Array.isArray(target)) {
            return this._transactBatch(target as RepositoryItem<T>[], mutator as (records: RepositoryItem<T>[]) => void);
        }
        return this._transactOne(target as RepositoryItem<T>, mutator as (record: RepositoryItem<T>) => void);
    }

    /** Returns the raw underlying record for any proxy returned by _execute, or the item itself. */
    private _unwrapProxy<T extends object>(item: RepositoryItem<T>): RepositoryItem<T> {
        return (this._proxyRaws.get(item) ?? item) as RepositoryItem<T>;
    }

    private async _transactOne<T extends object>(record: RepositoryItem<T>, mutator: (record: RepositoryItem<T>) => void): Promise<void> {
        // Pause the reactive auto-persist handler (if any) so it doesn't double-fire
        const entry = this._reactiveEntries.get(record);
        if (entry) entry.paused = true;

        const raw = this._unwrapProxy(record);
        const tableName = raw.$table;
        const snapshot = JSON.parse(JSON.stringify(raw)) as RepositoryItem<T>;

        const diff: Record<string, unknown> = {};
        const proxied = ObservableSlim.create(raw, false, (changes) => {
            for (const c of changes) {
                diff[c.property as string] = c.newValue;
            }
        }) as RepositoryItem<T>;

        mutator(proxied);

        if (entry) entry.paused = false;

        if (Object.keys(diff).length === 0) return;

        try {
            await this._store.update(tableName, raw.$id, diff);
        } catch (err) {
            Object.assign(raw as object, snapshot);
            throw err;
        }
    }

    private async _transactBatch<T extends object>(results: RepositoryItem<T>[], mutator: (records: RepositoryItem<T>[]) => void): Promise<void> {
        // 1. Pause reactive auto-persist handlers so they don't double-fire during the transaction
        const entries = results.map(r => this._reactiveEntries.get(r) ?? null);
        entries.forEach(e => { if (e) e.paused = true; });

        // 2. Unwrap any proxies (reactive or readonly) to get the raw records, then snapshot for rollback
        const raws = results.map(r => this._unwrapProxy(r));
        const snapshots = raws.map(r => JSON.parse(JSON.stringify(r)) as RepositoryItem<T>);

        // 3. Wire up observable-slim on each raw record to collect diffs
        const diffs = new Map<string, Record<string, unknown>>();
        const proxied = raws.map((raw) => {
            const id = raw.$id;
            return ObservableSlim.create(raw, false, (changes) => {
                for (const c of changes) {
                    if (!diffs.has(id)) diffs.set(id, {});
                    diffs.get(id)![c.property as string] = c.newValue;
                }
            }) as RepositoryItem<T>;
        });

        // 4. Let the caller mutate
        mutator(proxied);

        // 5. Resume reactive handlers
        entries.forEach(e => { if (e) e.paused = false; });

        // 6. Persist differential updates; rollback everything on failure
        try {
            for (const [id, diff] of diffs) {
                await this._store.update(raws[0].$table, id, diff);
            }
        } catch (err) {
            // Restore all records to their pre-transaction state
            for (let i = 0; i < raws.length; i++) {
                Object.assign(raws[i] as object, snapshots[i]);
            }
            throw err;
        }
    }

    /** @internal Used by OrmQueryBuilderImpl to execute against adapters. */
    async _execute<T>(tableName: string, descriptor: QueryDescriptor, isAggregate: boolean): Promise<RepositoryItem<T>[] | T[]> {
        // Check the cache for raw matching records (no aggregate/projection) so
        // that an empty cache applying an aggregate doesn't look like a cache hit.
        const rawCheck: QueryDescriptor = { conditions: descriptor.conditions, select: '*' };
        const cachedRaw = await this._cache.query(tableName, rawCheck);

        let records: unknown[];
        if (cachedRaw.length > 0) {
            records = await this._cache.query(tableName, descriptor);
        } else {
            records = await this._store.find(tableName, descriptor);
        }

        if (isAggregate) {
            return records as T[];
        }

        const items = records as RepositoryItem<T>[];

        if (this._reactive) {
            return items.map(record => {
                const entry = { paused: false };
                const proxy = ObservableSlim.create(record, false, (changes) => {
                    if (entry.paused) return;
                    const diff: Record<string, unknown> = {};
                    for (const c of changes) {
                        diff[c.property as string] = c.newValue;
                    }
                    if (Object.keys(diff).length > 0) {
                        this._store.update(record.$table, record.$id, diff)
                            .then(() => this._cache.clear(record.$table))
                            .catch(err => console.error('[orm] reactive update failed', err));
                    }
                }) as RepositoryItem<T>;
                this._proxyRaws.set(proxy, record);
                this._reactiveEntries.set(proxy, entry);
                return proxy;
            });
        } else {
            return items.map(record => {
                const proxy = new Proxy(record, {
                    set(_target, prop, _value) {
                        if (String(prop).startsWith('$')) return true;
                        throw new Error(
                            `Cannot mutate record directly when reactive is false. ` +
                            `Use db.Transaction() to modify records.`
                        );
                    }
                });
                this._proxyRaws.set(proxy, record);
                return proxy;
            });
        }
    }
}
