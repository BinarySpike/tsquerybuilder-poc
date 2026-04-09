import type { Query, QueryConditionLeaf, QueryConditionGroup, QueryConditions, QueryOrderBy } from './query.types'

type ConditionEntry = QueryConditionLeaf | QueryConditionGroup;

export class AggregateSelectorImpl {
  count() { return { type: 'count' as const }; }
  countDistinct(path: string) { return { type: 'countDistinct' as const, path }; }
  sum(path: string) { return { type: 'sum' as const, path }; }
  avg(path: string) { return { type: 'avg' as const, path }; }
  min(path: string) { return { type: 'min' as const, path }; }
  max(path: string) { return { type: 'max' as const, path }; }
  distinct(path: string) { return { type: 'distinct' as const, path }; }
}

export class QueryBuilderImpl {
  private _conditions: QueryConditions = [];
  private _currentGroup: QueryConditionGroup = [];
  private _currentPath: string = '';
  private _negated: boolean = false;
  protected _orderBys: QueryOrderBy[] = [];

  private _finalizeGroup(): void {
    while (this._currentGroup.length > 0) {
      const last = this._currentGroup[this._currentGroup.length - 1];
      if (last === 'and' || last === 'or') this._currentGroup.pop();
      else break;
    }
    if (this._currentGroup.length > 0) {
      this._conditions.push([...this._currentGroup]);
      this._currentGroup = [];
    }
    this._negated = false;
  }

  private _addCondition(operator: string, value: unknown): this {
    const op = this._negated ? `not.${operator}` : operator;
    this._negated = false;
    this._currentGroup.push([this._currentPath, op, value]);
    return this;
  }

  // --- Query / Subquery ---

  where(pathOrSubquery: string | ((qb: QueryBuilderImpl) => void)): any {
    this._negated = false;
    if (typeof pathOrSubquery === 'function') {
      const sub = new QueryBuilderImpl();
      pathOrSubquery(sub);
      sub._finalizeGroup();
      this._conditions.push(sub._conditions);
      return this;
    }
    this._currentPath = pathOrSubquery;
    return this;
  }

  // --- Condition methods ---

  is(value: unknown) { return this._addCondition('is', value); }
  in(values: unknown[]) { return this._addCondition('in', values); }
  contains(value: string) { return this._addCondition('contains', value); }
  beginsWith(value: string) { return this._addCondition('beginsWith', value); }
  endsWith(value: string) { return this._addCondition('endsWith', value); }
  greaterThan(value: number) { return this._addCondition('greaterThan', value); }
  lessThan(value: number) { return this._addCondition('lessThan', value); }
  between(a: unknown, b: unknown) {
    return this._addCondition('between', [a, b]);
  }
  before(value: Date) { return this._addCondition('before', value); }
  after(value: Date) { return this._addCondition('after', value); }
  has(value: unknown) { return this._addCondition('has', value); }
  hasSome(values: unknown[]) { return this._addCondition('hasSome', values); }
  hasEvery(values: unknown[]) { return this._addCondition('hasEvery', values); }

  // --- Negation ---

  get not(): any {
    this._negated = true;
    return this;
  }

  // --- Same-path chaining (stays in current group) ---

  get and(): any {
    this._negated = false;
    const last = this._currentGroup[this._currentGroup.length - 1];
    if (this._currentGroup.length > 0 && last !== 'and' && last !== 'or') {
      this._currentGroup.push('and');
    }
    return this;
  }

  get or(): any {
    this._negated = false;
    const last = this._currentGroup[this._currentGroup.length - 1];
    if (this._currentGroup.length > 0 && last !== 'and' && last !== 'or') {
      this._currentGroup.push('or');
    }
    return this;
  }

  // --- Cross-path chaining (starts new group) ---

  andWhere(pathOrSubquery: string | ((qb: QueryBuilderImpl) => void)): any {
    this._finalizeGroup();
    this._negated = false;
    if (this._conditions.length > 0) {
      this._conditions.push('and');
    }
    if (typeof pathOrSubquery === 'function') {
      const sub = new QueryBuilderImpl();
      pathOrSubquery(sub);
      sub._finalizeGroup();
      this._conditions.push(sub._conditions);
      return this;
    }
    this._currentPath = pathOrSubquery;
    return this;
  }

  orWhere(pathOrSubquery: string | ((qb: QueryBuilderImpl) => void)): any {
    this._finalizeGroup();
    this._negated = false;
    if (this._conditions.length > 0) {
      this._conditions.push('or');
    }
    if (typeof pathOrSubquery === 'function') {
      const sub = new QueryBuilderImpl();
      pathOrSubquery(sub);
      sub._finalizeGroup();
      this._conditions.push(sub._conditions);
      return this;
    }
    this._currentPath = pathOrSubquery;
    return this;
  }

  // --- Resolver methods ---

  orderBy(path: string, direction: 'asc' | 'desc' = 'asc'): any {
    this._orderBys.push({ path, direction });
    return this;
  }

  selectAll() {
    this._finalizeGroup();
    return {
      conditions: this._conditions,
      select: '*' as const,
      ...(this._orderBys.length > 0 && { orderBy: this._orderBys }),
    };
  }

  select(...args: unknown[]) {
    this._finalizeGroup();
    const lastArg = args[args.length - 1];
    let paths: string[];
    let aggregate: unknown;

    if (typeof lastArg === 'function') {
      paths = args.slice(0, -1) as string[];
      aggregate = lastArg(new AggregateSelectorImpl());
    } else {
      paths = args as string[];
    }

    return {
      conditions: this._conditions,
      ...(paths.length > 0 && { select: paths }),
      ...(aggregate !== undefined && { aggregate }),
      ...(this._orderBys.length > 0 && { orderBy: this._orderBys }),
    };
  }

  /** Inspect the built conditions without triggering a select. */
  getConditions(): QueryConditions {
    this._finalizeGroup();
    return this._conditions;
  }
}

/**
 * Initializes a new deeply-typed TopHeavy query.
 * @returns A query builder instance.
 * @example
 * ```ts
 * const q = query<MySchema>();
 * const results = q.where('user.age').greaterThan(18).selectAll();
 * ```
 */
export function query<T>(): Query<T> {
  return new QueryBuilderImpl() as any;
}
