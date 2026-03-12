interface EmptyQueryResolver {}

export interface QueryBuilder {
  where(): ConditionBuilder<ChainedQueryBuilder<QueryResolver> & QueryResolver>;
  where(subquery: (qb: SubqueryBuilder) => ChainedQueryBuilder<EmptyQueryResolver>): ChainedQueryBuilder<QueryResolver> & QueryResolver;
}

export interface SubqueryBuilder {
  where(): ConditionBuilder<ChainedQueryBuilder<EmptyQueryResolver> & EmptyQueryResolver>;
  where(subquery: (qb: SubqueryBuilder) => ChainedQueryBuilder<EmptyQueryResolver>): ChainedQueryBuilder<EmptyQueryResolver> & EmptyQueryResolver;
}

interface ConditionBuilder<R> {
  is(): R;
  not: Omit<ConditionBuilder<R>, 'not'>;
}

interface ChainedQueryBuilder<R> {
  andWhere(): ConditionBuilder<ChainedQueryBuilder<R> & R>;
  andWhere(subquery: (qb: SubqueryBuilder) => ChainedQueryBuilder<EmptyQueryResolver>): ChainedQueryBuilder<R> & R;
  and: ConditionBuilder<ChainedQueryBuilder<R> & R>;
  or: ConditionBuilder<ChainedQueryBuilder<R> & R>;
}

interface QueryResolver {
  select(): any;
}
