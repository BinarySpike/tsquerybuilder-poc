import type { Paths, PathType, SelectResult } from './path.ts'

export interface Query<T> {
  where<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, QueryResolver<T>> & QueryResolver<T>>;
  where<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ChainedQuery<T, PathType<T, P>, QueryResolver<T>> & QueryResolver<T>;
}

export interface Subquery<T> {
  where<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>> & EmptyQueryResolver<T>>;
  where<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>> & EmptyQueryResolver<T>;
}

interface BaseCondition<V, R> {
  is(value: V): R;
  in(values: V[]): R;
  readonly not: Omit<Condition<V, R>, 'not'>;
}

interface StringCondition<V, R> {
  beginsWith(value: string): R;
  endsWith(value: string): R;
  contains(value: string): R;
}

interface NumberCondition<V, R> {
  greaterThan(value: number): R;
  lessThan(value: number): R;
  between(min: number, max: number, inclusive?: boolean): R;
}

interface DateCondition<V, R> {
  before(value: Date): R;
  after(value: Date): R;
  between(start: Date, end: Date, inclusive?: boolean): R;
}

interface ArrayCondition<V, R> {
  has(value: V extends Array<infer U> ? U : never): R;
  hasSome(values: V extends Array<infer U> ? U[] : never): R;
  hasEvery(values: V extends Array<infer U> ? U[] : never): R;
}

type Condition<V, R> = BaseCondition<V, R>
  & (V extends string ? StringCondition<V, R> : {})
  & (V extends number ? NumberCondition<V, R> : {})
  & (V extends Date ? DateCondition<V, R> : {})
  & (V extends any[] ? ArrayCondition<V, R> : {})

interface ChainedQuery<T, V, R> {
  andWhere<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, R> & R>;
  andWhere<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ChainedQuery<T, PathType<T, P>, R> & R;
  orWhere<P extends Paths<T>>(path: P): Condition<PathType<T, P>, ChainedQuery<T, PathType<T, P>, R> & R>;
  orWhere<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ChainedQuery<T, PathType<T, P>, R> & R;
  and: Condition<V, ChainedQuery<T, V, R> & R>;
  or: Condition<V, ChainedQuery<T, V, R> & R>;
}

export interface AggregateSelector<T> {
  count(): number;
  countDistinct<P extends Paths<T>>(path: P): number;
  sum<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  avg<P extends Paths<T>>(path: P): PathType<T, P> extends number ? number : never;
  min<P extends Paths<T>>(path: P): PathType<T, P>;
  max<P extends Paths<T>>(path: P): PathType<T, P>;
  distinct<P extends Paths<T>>(path: P): PathType<T, P>[];
}

interface QueryResolver<T> {
  orderBy<P extends Paths<T>>(path: P, direction?: 'asc' | 'desc'): QueryResolver<T>;
  selectAll(): T[];
  select<P extends Paths<T>[]>(...paths: [...P]): SelectResult<T, P>[];
  select<A>(aggregate: (s: AggregateSelector<T>) => A): A;
  select<P extends Paths<T>[], A>(...args: [...P, (s: AggregateSelector<T>) => A]): (SelectResult<T, P> & A)[];
}

interface EmptyQueryResolver<T> { }
