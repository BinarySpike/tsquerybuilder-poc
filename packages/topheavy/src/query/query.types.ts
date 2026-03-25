import type { Paths, PathType, SelectResult } from './path'

// ── Condition tree types ──────────────────────────────────────────────

/** A single condition leaf: [path, operator, value] */
export type QueryConditionLeaf = [string, string, unknown];
/** A grouped set of conditions joined by logical operators */
export type QueryConditionGroup = (QueryConditionLeaf | QueryConditionGroup | 'and' | 'or')[];
/** The full conditions tree returned by {@link QueryResolver.getConditions} */
export type QueryConditions = (QueryConditionGroup | 'and' | 'or')[];

/**
 * Main query building interface containing chained condition methods.
 * @typeParam T - The generic data type representing the schema.
 */
export interface Query<T> {
  /**
   * Initializes a condition on a specific path within your schema.
   * @param path - The dot-separated property path.
   */
  where<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, QueryResolver<T>> & QueryResolver<T>>;

  /**
   * Initializes a subquery block for grouped conditions.
   * @param subquery - A callback containing the subquery statements.
   */
  where<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ChainedQuery<T, PathType<T, P>, QueryResolver<T>> & QueryResolver<T>;
}

/**
 * Interface representing a subquery block context.
 * Used when nesting grouped conditions inside an outer query.
 */
export interface Subquery<T> {
  /** Target a path for a condition */
  where<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>> & EmptyQueryResolver<T>>;
  /** Create a nested subquery */
  where<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>> & EmptyQueryResolver<T>;
}

/** General equality methods applicable to any field */
export interface BaseCondition<V, R> {
  /** Strict equality (`===`) */
  is(value: V): R;
  /** Matches if value exists in array (`IN (...)`) */
  in(values: V[]): R;
  /** Negates the next chained condition (`NOT`) */
  readonly not: Omit<Condition<V, R>, 'not'>;
}

/** Specific conditions available for textual fields */
export interface StringCondition<V, R> {
  /** Requires string to start with specific sequence */
  beginsWith(value: string): R;
  /** Requires string to end with specific sequence */
  endsWith(value: string): R;
  /** Requires string to include the stated substring */
  contains(value: string): R;
}

/** Mathematical inequalities available for numeric fields */
export interface NumberCondition<V, R> {
  /** Strict greater than (`>`) */
  greaterThan(value: number): R;
  /** Strict less than (`<`) */
  lessThan(value: number): R;
  /** Range inclusion (inclusive by default) */
  between(min: number, max: number, inclusive?: boolean): R;
}

/** Chronological constraint operators available for date fields */
export interface DateCondition<V, R> {
  /** Must occur strictly before the target date */
  before(value: Date): R;
  /** Must occur strictly after the target date */
  after(value: Date): R;
  /** Range inclusion constraint for date comparisons */
  between(start: Date, end: Date, inclusive?: boolean): R;
}

/** Structural matchers for finding elements inside array typed fields */
export interface ArrayCondition<V, R> {
  /** Contains the exact element */
  has(value: V extends Array<infer U> ? U : never): R;
  /** Contains at least one of the provided elements */
  hasSome(values: V extends Array<infer U> ? U[] : never): R;
  /** Contains all of the provided elements */
  hasEvery(values: V extends Array<infer U> ? U[] : never): R;
}

export type Condition<V, R> = BaseCondition<V, R>
  & (V extends string ? StringCondition<V, R> : {})
  & (V extends number ? NumberCondition<V, R> : {})
  & (V extends Date ? DateCondition<V, R> : {})
  & (V extends any[] ? ArrayCondition<V, R> : {})

/**
 * Continuable interface providing `AND` / `OR` query branching.
 */
export interface ChainedQuery<T, V, R> {
  /** Chains a new condition against a different path with `AND` */
  andWhere<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, R> & R>;
  /** Safely starts a subquery group separated by `AND` */
  andWhere<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ChainedQuery<T, PathType<T, P>, R> & R;
  /** Chains a new condition against a different path with `OR` */
  orWhere<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, R> & R>;
  /** Safely starts a subquery group separated by `OR` */
  orWhere<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ChainedQuery<T, PathType<T, P>, R> & R;
  /** Chains additional conditions on the SAME active path with `AND` */
  and: Condition<V, ChainedQuery<T, V, R> & R>;
  /** Chains additional conditions on the SAME active path with `OR` */
  or: Condition<V, ChainedQuery<T, V, R> & R>;
}

/**
 * Mathematical aggregation operators.
 */
export interface AggregateSelector<T> {
  /** Number of matching document rows */
  count(): number;
  /** Count of distinct entries isolated to a property */
  countDistinct<P extends Paths<T>>(path: P): number;
  /** Additive sum function applied to numeric fields */
  sum<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  /** Calculates average computed from queried numeric field rows */
  avg<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  /** Minimum value recorded in this dataset projection */
  min<P extends Paths<T>>(path: P): PathType<T, P>;
  /** Maximum value recorded in this dataset projection */
  max<P extends Paths<T>>(path: P): PathType<T, P>;
  /** Array array of dynamically distinct unique values found */
  distinct<P extends Paths<T>>(path: P): PathType<T, P>[];
}

/**
 * The terminating query execution block to resolve the constructed queries.
 */
export interface QueryResolver<T> {
  /**
   * Applies an ORDER BY sort condition.
   * @param path - The property to order by.
   * @param direction - 'asc' or 'desc'.
   */
  orderBy<P extends Paths<T>>(path: P, direction?: 'asc' | 'desc'): QueryResolver<T>;

  /** Retrieves all fields from the document/row. */
  selectAll(): T[];

  /** Retrieves specific fields by their property paths. */
  select<P extends Paths<T>[]>(...paths: [...P]): SelectResult<T, P>[];

  /** Applies an aggregate function against the queried records. */
  select<A>(aggregate: (s: AggregateSelector<T>) => A): A;

  /** Retrieves mapped fields along with an aggregate function. */
  select<P extends Paths<T>[], A>(...args: [...P, (s: AggregateSelector<T>) => A]): (SelectResult<T, P> & A)[];

  /** Resolves and returns the constructed query conditions tree without executing a select. */
  getConditions(): QueryConditions;
}

export interface EmptyQueryResolver<T> { }
