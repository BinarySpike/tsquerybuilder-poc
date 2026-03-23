[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / query

# Function: query()

> **query**\<`T`\>(): [`Query`](../interfaces/Query.md)\<`T`\>

Defined in: query/queryBuilder.ts:173

Initializes a new deeply-typed TopHeavy query.

## Type Parameters

### T

`T`

## Returns

[`Query`](../interfaces/Query.md)\<`T`\>

A query builder instance.

## Example

```ts
const q = query<MySchema>();
const results = q.where('user.age').greaterThan(18).selectAll();
```
