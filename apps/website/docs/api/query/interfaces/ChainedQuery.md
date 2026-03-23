[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / ChainedQuery

# Interface: ChainedQuery\<T, V, R\>

Defined in: query/topheavy.ts:91

Continuable interface providing `AND` / `OR` query branching.

## Type Parameters

### T

`T`

### V

`V`

### R

`R`

## Properties

### and

> **and**: [`Condition`](../type-aliases/Condition.md)\<`V`, `ChainedQuery`\<`T`, `V`, `R`\> & `R`\>

Defined in: query/topheavy.ts:101

Chains additional conditions on the SAME active path with `AND`

***

### or

> **or**: [`Condition`](../type-aliases/Condition.md)\<`V`, `ChainedQuery`\<`T`, `V`, `R`\> & `R`\>

Defined in: query/topheavy.ts:103

Chains additional conditions on the SAME active path with `OR`

## Methods

### andWhere()

#### Call Signature

> **andWhere**\<`P`\>(`path`): [`Condition`](../type-aliases/Condition.md)\<[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `R`\> & `R`\>

Defined in: query/topheavy.ts:93

Chains a new condition against a different path with `AND`

##### Type Parameters

###### P

`P` *extends* `string`

##### Parameters

###### path

`P`

##### Returns

[`Condition`](../type-aliases/Condition.md)\<[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `R`\> & `R`\>

#### Call Signature

> **andWhere**\<`P`\>(`subquery`): `ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `R`\> & `R`

Defined in: query/topheavy.ts:95

Safely starts a subquery group separated by `AND`

##### Type Parameters

###### P

`P` *extends* `string`

##### Parameters

###### subquery

(`qb`) => `ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\>

##### Returns

`ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `R`\> & `R`

***

### orWhere()

#### Call Signature

> **orWhere**\<`P`\>(`path`): [`Condition`](../type-aliases/Condition.md)\<[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `R`\> & `R`\>

Defined in: query/topheavy.ts:97

Chains a new condition against a different path with `OR`

##### Type Parameters

###### P

`P` *extends* `string`

##### Parameters

###### path

`P`

##### Returns

[`Condition`](../type-aliases/Condition.md)\<[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `R`\> & `R`\>

#### Call Signature

> **orWhere**\<`P`\>(`subquery`): `ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `R`\> & `R`

Defined in: query/topheavy.ts:99

Safely starts a subquery group separated by `OR`

##### Type Parameters

###### P

`P` *extends* `string`

##### Parameters

###### subquery

(`qb`) => `ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, [`EmptyQueryResolver`](EmptyQueryResolver.md)\<`T`\>\>

##### Returns

`ChainedQuery`\<`T`, [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>, `R`\> & `R`
