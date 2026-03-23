[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / Query

# Interface: Query\<T\>

Defined in: query/topheavy.ts:7

Main query building interface containing chained condition methods.

## Type Parameters

### T

`T`

The generic data type representing the schema.

## Methods

### where()

#### Call Signature

> **where**\<`P`\>(`path`): [`Condition`](../type-aliases/Condition.md)\<[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`QueryResolver`](QueryResolver.md)\<`T`\>\> & [`QueryResolver`](QueryResolver.md)\<`T`\>\>

Defined in: query/topheavy.ts:12

Initializes a condition on a specific path within your schema.

##### Type Parameters

###### P

`P` *extends* `string`

##### Parameters

###### path

`P`

The dot-separated property path.

##### Returns

[`Condition`](../type-aliases/Condition.md)\<[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`QueryResolver`](QueryResolver.md)\<`T`\>\> & [`QueryResolver`](QueryResolver.md)\<`T`\>\>

#### Call Signature

> **where**\<`P`\>(`subquery`): [`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`QueryResolver`](QueryResolver.md)\<`T`\>\> & [`QueryResolver`](QueryResolver.md)\<`T`\>

Defined in: query/topheavy.ts:18

Initializes a subquery block for grouped conditions.

##### Type Parameters

###### P

`P` *extends* `string`

##### Parameters

###### subquery

(`qb`) => [`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\>

A callback containing the subquery statements.

##### Returns

[`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`QueryResolver`](QueryResolver.md)\<`T`\>\> & [`QueryResolver`](QueryResolver.md)\<`T`\>
