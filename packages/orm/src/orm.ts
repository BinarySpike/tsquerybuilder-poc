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

    constructor(
        cache: CacheAdapter,
        store: StoreAdapter,
        _options: DatabaseOptions<Tables>,
    ) {
        this._cache = cache;
        this._store = store;
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

    private async _transactOne<T extends object>(record: RepositoryItem<T>, mutator: (record: RepositoryItem<T>) => void): Promise<void> {
        const tableName = record.$table;
        const snapshot = JSON.parse(JSON.stringify(record)) as RepositoryItem<T>;

        const diff: Record<string, unknown> = {};
        const proxied = ObservableSlim.create(record, false, (changes) => {
            for (const c of changes) {
                diff[c.property as string] = c.newValue;
            }
        }) as RepositoryItem<T>;

        mutator(proxied);

        if (Object.keys(diff).length === 0) return;

        try {
            await this._store.update(tableName, record.$id, diff);
        } catch (err) {
            Object.assign(record as object, snapshot);
            throw err;
        }
    }

    private async _transactBatch<T extends object>(results: RepositoryItem<T>[], mutator: (records: RepositoryItem<T>[]) => void): Promise<void> {
        // 1. Snapshot every record for rollback
        const snapshots = results.map(r => JSON.parse(JSON.stringify(r)) as RepositoryItem<T>);

        // 2. Wire up observable-slim on each record to collect diffs
        const diffs = new Map<string, Record<string, unknown>>();
        const proxied = results.map((r) => {
            const id = r.$id;
            return ObservableSlim.create(r, false, (changes) => {
                for (const c of changes) {
                    if (!diffs.has(id)) diffs.set(id, {});
                    diffs.get(id)![c.property as string] = c.newValue;
                }
            }) as RepositoryItem<T>;
        });

        // 3. Let the caller mutate
        mutator(proxied);

        // 4. Persist differential updates; rollback everything on failure
        try {
            for (const [id, diff] of diffs) {
                await this._store.update(results[0].$table, id, diff);
            }
        } catch (err) {
            // Restore all records to their pre-transaction state
            for (let i = 0; i < results.length; i++) {
                Object.assign(results[i] as object, snapshots[i]);
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

        return records as RepositoryItem<T>[];
    }
}
