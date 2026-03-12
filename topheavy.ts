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
 * QUERY RESOLVER (execution methods, only available at root level via intersection)
 */

interface IThQueryResolver<T> {
  select(): T[];
  count(): number;
  countDistinct<P extends Paths<T>>(path: P): number;
  sum<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  avg<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  min<P extends Paths<T>>(path: P): PathType<T, P>;
  max<P extends Paths<T>>(path: P): PathType<T, P>;
  distinct<P extends Paths<T>>(path: P): PathType<T, P>[];
  orderBy<P extends Paths<T>>(path: P, direction?: 'asc' | 'desc'): IThChainedQueryBuilder<T, any, IThQueryResolver<T>> & IThQueryResolver<T>;
}

/**
 * ROOT QUERY BUILDER
 */

export interface IThQueryBuilderEntry<T> {
  where<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThChainedQueryBuilder<T, PathType<T, P>, IThQueryResolver<T>> & IThQueryResolver<T>>;
  where(subquery: (qb: IThSubqueryBuilder<T>) => IThChainedQueryBuilder<T, any, null>): IThChainedQueryBuilder<T, any, IThQueryResolver<T>> & IThQueryResolver<T>;
}

/**
 * SUBQUERY BUILDER
 */

export interface IThSubqueryBuilder<T> {
  where<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThChainedQueryBuilder<T, PathType<T, P>, null>>;
  where(subquery: (qb: IThSubqueryBuilder<T>) => IThChainedQueryBuilder<T, any, null>): IThChainedQueryBuilder<T, any, null>;
}

/**
 * CHAINED QUERY BUILDER
 * R is IThQueryResolver<T> at root level (gives execution methods via & R),
 * or null at subquery level (& null is a no-op).
 */

interface IThChainedQueryBuilder<T, V, R> {
  andWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThChainedQueryBuilder<T, PathType<T, P>, R> & R>;
  andWhere(subquery: (qb: IThSubqueryBuilder<T>) => IThChainedQueryBuilder<T, any, null>): IThChainedQueryBuilder<T, any, R> & R;

  orWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, IThChainedQueryBuilder<T, PathType<T, P>, R> & R>;
  orWhere(subquery: (qb: IThSubqueryBuilder<T>) => IThChainedQueryBuilder<T, any, null>): IThChainedQueryBuilder<T, any, R> & R;

  readonly and: IThCondition<T, V, IThChainedQueryBuilder<T, V, R> & R>;
  readonly or: IThCondition<T, V, IThChainedQueryBuilder<T, V, R> & R>;
}
