[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / AggregateSelector

# Interface: AggregateSelector\<T\>

Defined in: query/topheavy.ts:109

Mathematical aggregation operators.

## Type Parameters

### T

`T`

## Methods

### avg()

> **avg**\<`P`\>(`path`): [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\> *extends* `number` ? `number` : `never`

Defined in: query/topheavy.ts:117

Calculates average computed from queried numeric field rows

#### Type Parameters

##### P

`P` *extends* `string`

#### Parameters

##### path

`P`

#### Returns

[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\> *extends* `number` ? `number` : `never`

***

### count()

> **count**(): `number`

Defined in: query/topheavy.ts:111

Number of matching document rows

#### Returns

`number`

***

### countDistinct()

> **countDistinct**\<`P`\>(`path`): `number`

Defined in: query/topheavy.ts:113

Count of distinct entries isolated to a property

#### Type Parameters

##### P

`P` *extends* `string`

#### Parameters

##### path

`P`

#### Returns

`number`

***

### distinct()

> **distinct**\<`P`\>(`path`): [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>[]

Defined in: query/topheavy.ts:123

Array array of dynamically distinct unique values found

#### Type Parameters

##### P

`P` *extends* `string`

#### Parameters

##### path

`P`

#### Returns

[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>[]

***

### max()

> **max**\<`P`\>(`path`): [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>

Defined in: query/topheavy.ts:121

Maximum value recorded in this dataset projection

#### Type Parameters

##### P

`P` *extends* `string`

#### Parameters

##### path

`P`

#### Returns

[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>

***

### min()

> **min**\<`P`\>(`path`): [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>

Defined in: query/topheavy.ts:119

Minimum value recorded in this dataset projection

#### Type Parameters

##### P

`P` *extends* `string`

#### Parameters

##### path

`P`

#### Returns

[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\>

***

### sum()

> **sum**\<`P`\>(`path`): [`PathType`](../type-aliases/PathType.md)\<`T`, `P`\> *extends* `number` ? `number` : `never`

Defined in: query/topheavy.ts:115

Additive sum function applied to numeric fields

#### Type Parameters

##### P

`P` *extends* `string`

#### Parameters

##### path

`P`

#### Returns

[`PathType`](../type-aliases/PathType.md)\<`T`, `P`\> *extends* `number` ? `number` : `never`
