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

// Context type for tracking whether we're in root or subquery context
type QueryContext = 'root' | 'subquery';

// Helper type that determines what a condition returns based on context
type IThConditionReturn<T, V, Ctx extends QueryContext> =
  Ctx extends 'root' ? IThQueryBuilderChain<T, V> : IThQueryBuilderSubqueryChain<T, V>;

// Base condition methods available for all types
interface IThBaseCondition<T, V, Ctx extends QueryContext> {
  is(value: V): IThConditionReturn<T, V, Ctx>;
  in(values: V[]): IThConditionReturn<T, V, Ctx>;
  readonly not: Omit<IThCondition<T, V, Ctx>, 'not' | 'and' | 'or'>;

  // Shortcuts that remember the current path
  readonly and: Omit<IThCondition<T, V, Ctx>, 'and' | 'or'>;
  readonly or: Omit<IThCondition<T, V, Ctx>, 'and' | 'or'>;
}

// String-specific condition methods
interface IThStringCondition<T, V, Ctx extends QueryContext> {
  beginsWith(value: string): IThConditionReturn<T, V, Ctx>;
  endsWith(value: string): IThConditionReturn<T, V, Ctx>;
  contains(value: string): IThConditionReturn<T, V, Ctx>;
}

// Numeric-specific condition methods
interface IThNumericCondition<T, V, Ctx extends QueryContext> {
  greaterThan(value: number): IThConditionReturn<T, V, Ctx>;
  lessThan(value: number): IThConditionReturn<T, V, Ctx>;
  between(min: number, max: number): IThConditionReturn<T, V, Ctx>;
}

// Date-specific condition methods
interface IThDateCondition<T, V, Ctx extends QueryContext> {
  before(value: Date): IThConditionReturn<T, V, Ctx>;
  after(value: Date): IThConditionReturn<T, V, Ctx>;
  between(start: Date, end: Date): IThConditionReturn<T, V, Ctx>;
}

// Array-specific condition methods
interface IThArrayCondition<T, V, Ctx extends QueryContext> {
  has(value: V extends Array<infer U> ? U : never): IThConditionReturn<T, V, Ctx>;
  hasSome(values: V extends Array<infer U> ? U[] : never): IThConditionReturn<T, V, Ctx>;
  hasEvery(values: V extends Array<infer U> ? U[] : never): IThConditionReturn<T, V, Ctx>;
}

// Combined condition type with context awareness
export type IThCondition<T, V, Ctx extends QueryContext> = IThBaseCondition<T, V, Ctx> &
  (V extends string ? IThStringCondition<T, V, Ctx> : {}) &
  (V extends number ? IThNumericCondition<T, V, Ctx> : {}) &
  (V extends Date ? IThDateCondition<T, V, Ctx> : {}) &
  (V extends any[] ? IThArrayCondition<T, V, Ctx> : {});

// Entry point - only has where()
export interface IThQueryBuilderEntry<T> {
  where(callback: (qb: IThQueryBuilderSubquery<T>) => IThQueryBuilderSubqueryChain<T>): IThQueryBuilderChain<T>;
  where<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, 'root'>;
}

// Filtering methods for chaining (after first where)
interface IThQueryChainMethods<T, V = any> {
  andWhere(callback: (qb: IThQueryBuilderSubquery<T>) => IThQueryBuilderSubqueryChain<T>): IThQueryBuilderChain<T>;
  andWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, 'root'>;

  orWhere(callback: (qb: IThQueryBuilderSubquery<T>) => IThQueryBuilderSubqueryChain<T>): IThQueryBuilderChain<T>;
  orWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, 'root'>;

  // Shortcuts that remember the current value type
  readonly and: IThCondition<T, V, 'root'>;
  readonly or: IThCondition<T, V, 'root'>;
}

// Execution methods - only available in root context
interface IThQueryExecutionMethods<T> {
  select(): T[];
  count(): number;
  countDistinct<P extends Paths<T>>(path: P): number;
  sum<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  avg<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  min<P extends Paths<T>>(path: P): PathType<T, P>;
  max<P extends Paths<T>>(path: P): PathType<T, P>;
  distinct<P extends Paths<T>>(path: P): PathType<T, P>[];
  orderBy<P extends Paths<T>>(path: P, direction?: 'asc' | 'desc'): IThQueryBuilderChain<T>;
}

export type IThQueryBuilderChain<T, V = any> =
  IThQueryChainMethods<T, V> &
  IThQueryExecutionMethods<T>;

// Inside subqueries - entry point, only has where()
export interface IThQueryBuilderSubquery<T> {
  where<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, 'subquery'>;
}

// After where() in subquery - has andWhere/orWhere + shortcuts, NO execution methods
export interface IThQueryBuilderSubqueryChain<T, V = any> {
  andWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, 'subquery'>;
  orWhere<P extends Paths<T>>(path: P): IThCondition<T, PathType<T, P>, 'subquery'>;

  // Shortcuts that remember the current value type
  readonly and: IThCondition<T, V, 'subquery'>;
  readonly or: IThCondition<T, V, 'subquery'>;
}

// Backward compatibility alias
export type IThQueryBuilder<T> = IThQueryBuilderEntry<T>;
