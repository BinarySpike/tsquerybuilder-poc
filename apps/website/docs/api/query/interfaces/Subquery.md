[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / Subquery

# Interface: Subquery\<T\>

Defined in: query/topheavy.ts:25

Interface representing a subquery block context.
Used when nesting grouped conditions inside an outer query.

## Type Parameters

### T

`T`

## Methods

### where()

#### Call Signature

> **where**\<`P`\>(`path`): [`Condition`](../type-aliases/Condition.md)\<[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\> & [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\>

Defined in: query/topheavy.ts:27

Target a path for a condition

##### Type Parameters

###### P

`P` *extends* `string`

##### Parameters

###### path

`P`

##### Returns

[`Condition`](../type-aliases/Condition.md)\<[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\> & [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\>

#### Call Signature

> **where**\<`P`\>(`subquery`): [`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\> & [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>

Defined in: query/topheavy.ts:29

Create a nested subquery

##### Type Parameters

###### P

`P` *extends* `string`

##### Parameters

###### subquery

(`qb`) => [`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\>

##### Returns

[`ChainedQuery`](ChainedQuery.md)\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\> & [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>
