import type { QueryConditions, QueryOrderBy, QueryResolver, ChainedQuery, Condition, AggregateSelector, Paths, PathType } from '@topheavy/query';
import type { TypeDefinition } from '@topheavy/schema';

// ── Query descriptor ─────────────────────────────────────────────────

/** Mirrors the aggregate descriptor shapes produced by AggregateSelector */
export type AggregateDescriptor =
    | { type: 'count' }
    | { type: 'countDistinct'; path: string }
    | { type: 'sum'; path: string }
    | { type: 'avg'; path: string }
    | { type: 'min'; path: string }
    | { type: 'max'; path: string }
    | { type: 'distinct'; path: string };

/** Full query descriptor passed from the ORM builder to adapters */
export interface QueryDescriptor {
    conditions: QueryConditions;
    /** '*' = all fields; string[] = specific paths to project */
    select: '*' | string[];
    aggregate?: AggregateDescriptor;
    orderBy?: QueryOrderBy[];
}

// ── Adapter interfaces ────────────────────────────────────────────────

/** Client-side cache layer (localStorage, IndexedDB, in-memory) */
export interface CacheAdapter {
    get(tableName: string, id: unknown): Promise<unknown | null>;
    set(tableName: string, id: unknown, value: unknown): Promise<void>;
    delete(tableName: string, id: unknown): Promise<void>;
    query(tableName: string, descriptor: QueryDescriptor): Promise<unknown[]>;
    clear(tableName: string): Promise<void>;
}

/** Persistent storage layer (Postgres, Mongo, in-memory) */
export interface StoreAdapter {
    find(tableName: string, descriptor: QueryDescriptor): Promise<unknown[]>;
    findOne(tableName: string, descriptor: QueryDescriptor): Promise<unknown | null>;
    insert(tableName: string, value: unknown): Promise<void>;
    update(tableName: string, id: unknown, value: unknown): Promise<void>;
    delete(tableName: string, id: unknown): Promise<void>;
}

// ── Database options ──────────────────────────────────────────────────

export interface DatabaseOptions<Tables extends Record<string, TypeDefinition<any, any>>> {
    tables: Tables;
}

/** Extracts the inferred TypeScript type from a TypeDefinition */
export type TableType<Tables, K extends keyof Tables> =
    Tables[K] extends TypeDefinition<infer T, any> ? T : never;

// ── Mutable result ────────────────────────────────────────────────────

/**
 * A record returned from a query, augmented with its store key and source table.
 * Both `$id` and `$table` are stamped as non-enumerable properties by the store
 * adapter so they do not appear in JSON.stringify, spread, or schema validation —
 * but they are visible in the type system so `db.delete(tableName, record.$id)`
 * and `db.Transaction(record, ...)` compile without any cast.
 */
export type RepositoryItem<T> = T & { readonly $id: string; readonly $table: string };

/**
 * Returned by non-aggregate selects. Each element is a `RepositoryItem<T>` with
 * `$id` and `$table` stamped on it by the adapter.
 *
 * Aggregate selects return a plain `A[]` whose elements lack `$id`/`$table`, so
 * TypeScript rejects passing them to `Database.Transaction` at compile time.
 */
export type MutableResult<T> = Array<RepositoryItem<T>>;

// ── ORM query types ───────────────────────────────────────────────────

/**
 * Extends QueryResolver<T> but overrides selectAll/select to return
 * PromiseLike results instead of plain descriptor objects.
 *
 * Non-aggregate selects resolve to MutableResult<T> (usable in Transaction).
 * Aggregate selects resolve to a plain array (not usable in Transaction —
 * enforced at compile time because elements lack $id/$table).
 */
export interface OrmResolver<T> extends Omit<QueryResolver<T>, 'selectAll' | 'select'>, PromiseLike<MutableResult<T>> {
    selectAll(): PromiseLike<MutableResult<T>>;
    /** Non-aggregate: select specific fields — returns MutableResult */
    select<P extends Paths<T>[]>(...paths: [...P]): PromiseLike<MutableResult<T>>;
    /** Aggregate only: returns a plain array (NOT MutableResult) */
    select<A>(aggregate: (s: AggregateSelector<T>) => A): PromiseLike<A[]>;
    /** Mixed paths + aggregate: returns a plain array (NOT MutableResult) */
    select<P extends Paths<T>[], A>(...args: [...P, (s: AggregateSelector<T>) => A]): PromiseLike<A[]>;
}

/**
 * The fluent query builder returned by db.query(tableName).
 * Uses Condition and ChainedQuery from topheavy/query directly — no duplicated
 * condition types. OrmResolver<T> threads through the chain so every
 * intermediate result is also awaitable.
 */
export interface OrmQueryBuilder<T> extends PromiseLike<MutableResult<T>> {
    where<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, OrmResolver<T>> & OrmResolver<T>>;
    andWhere<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, OrmResolver<T>> & OrmResolver<T>>;
    orWhere<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, OrmResolver<T>> & OrmResolver<T>>;
}
