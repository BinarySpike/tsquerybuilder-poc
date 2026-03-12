export interface QueryBuilder {
  where(): ConditionBuilder<ChainedQueryBuilder<QueryResolver> & QueryResolver>;
  where(subquery: (qb: SubqueryBuilder) => ChainedQueryBuilder<null>): ChainedQueryBuilder<QueryResolver> & QueryResolver;
}

export interface SubqueryBuilder {
  where(): ConditionBuilder<ChainedQueryBuilder<null>>;
  where(subquery: (qb: SubqueryBuilder) => ChainedQueryBuilder<null>): ConditionBuilder<ChainedQueryBuilder<null>>;
}

interface ConditionBuilder<R> {
  is(): R;
  not: Omit<ConditionBuilder<R>, 'not'>;
}

interface ChainedQueryBuilder<R> {
  andWhere(): ConditionBuilder<ChainedQueryBuilder<R> & R>;
  andWhere(subquery: (qb: SubqueryBuilder) => ChainedQueryBuilder<null>): ChainedQueryBuilder<R> & R; // ***
  and: ConditionBuilder<R>;
  or: ConditionBuilder<R>;
}

interface QueryResolver {
  select(): any;
}