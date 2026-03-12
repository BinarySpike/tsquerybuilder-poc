/**
 * TYPE UTILITIES
 */
export type Paths<T> = T extends Date | Array<any> ? never :
  T extends object ? { [K in keyof T]:
    K extends string | number ?
    `${K}` | `${K}.${Paths<T[K]>}`
    : never
  }[keyof T] : never;

export type PathType<T, P extends string> =
  P extends `${infer Key}.${infer Rest}` ?
  Key extends keyof T ?
  PathType<T[Key], Rest>
  : never
  : P extends keyof T ? T[P] : never;

/**
 * CONDITION INTERFACES
 * These contain ONLY the filter logic (is, in, beginsWith, etc.)
 * They NO LONGER contain .and or .or.
 */

interface IThBaseCondition<T, V, R> {
  is(value: V): R;
  in(values: V[]): R;
  readonly not: Omit<IThCondition<T, V, R>, 'not'>;
}

interface IThStringCondition<T, V, R> {
  beginsWith(value: string): R;
  endsWith(value: string): R;
  contains(value: string): R;
}

interface IThNumericCondition<T, V, R> {
  greaterThan(value: number): R;
  lessThan(value: number): R;
  between(min: number, max: number): R;
}

interface IThDateCondition<T, V, R> {
  before(value: Date): R;
  after(value: Date): R;
  between(start: Date, end: Date): R;
}

interface IThArrayCondition<T, V, R> {
  has(value: V extends Array<infer U> ? U : never): R;
  hasSome(values: V extends Array<infer U> ? U[] : never): R;
  hasEvery(values: V extends Array<infer U> ? U[] : never): R;
}

export type IThCondition<T, V, R> = IThBaseCondition<T, V, R> &
  (V extends string ? IThStringCondition<T, V, R> : {}) &
  (V extends number ? IThNumericCondition<T, V, R> : {}) &
  (V extends Date ? IThDateCondition<T, V, R> : {}) &
  (V extends any[] ? IThArrayCondition<T, V, R> : {});

/**
 * ROOT QUERY BUILDER
 */

export interface IThQueryBuilderEntry<T> {
  where(callback: (qb: IThQueryBuilderSubquery<T>) => IThQueryBuilderSubqueryChain<T, any>): IThQueryBuilderChain<T, any>;
  where<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThQueryBuilderChain<T, PathType<T, P>>>;
}

interface IThQueryChainMethods<T, V> {
  andWhere(callback: (qb: IThQueryBuilderSubquery<T>) => IThQueryBuilderSubqueryChain<T, any>): IThQueryBuilderChain<T, V>;
  andWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThQueryBuilderChain<T, PathType<T, P>>>;

  orWhere(callback: (qb: IThQueryBuilderSubquery<T>) => IThQueryBuilderSubqueryChain<T, any>): IThQueryBuilderChain<T, V>;
  orWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThQueryBuilderChain<T, PathType<T, P>>>;

  // Connectors ONLY exist here, after a logic method (is/in/etc) has been called
  readonly and: IThCondition<T, V, IThQueryBuilderChain<T, V>>;
  readonly or: IThCondition<T, V, IThQueryBuilderChain<T, V>>;
}

interface IThQueryExecutionMethods<T> {
  select(): T[];
  count(): number;
  countDistinct<P extends Paths<T>>(path: P): number;
  sum<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  avg<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  min<P extends Paths<T>>(path: P): PathType<T, P>;
  max<P extends Paths<T>>(path: P): PathType<T, P>;
  distinct<P extends Paths<T>>(path: P): PathType<T, P>[];
  orderBy<P extends Paths<T>>(path: P, direction?: 'asc' | 'desc'): IThQueryBuilderChain<T, any>;
}

export type IThQueryBuilderChain<T, V> = IThQueryChainMethods<T, V> & IThQueryExecutionMethods<T>;

/**
 * SUBQUERY BUILDER
 */

export interface IThQueryBuilderSubquery<T> {
  // Returns IThCondition (Logic only, no .and/.or)
  where<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThQueryBuilderSubqueryChain<T, PathType<T, P>>>;
}

export interface IThQueryBuilderSubqueryChain<T, V> {
  andWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThQueryBuilderSubqueryChain<T, PathType<T, P>>>;
  orWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThQueryBuilderSubqueryChain<T, PathType<T, P>>>;

  // Shortcuts ONLY available once the previous condition is complete
  readonly and: IThCondition<T, V, IThQueryBuilderSubqueryChain<T, V>>;
  readonly or: IThCondition<T, V, IThQueryBuilderSubqueryChain<T, V>>;
}
