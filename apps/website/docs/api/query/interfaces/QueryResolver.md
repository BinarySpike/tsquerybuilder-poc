[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / QueryResolver

# Interface: QueryResolver\<T\>

Defined in: query/topheavy.ts:129

The terminating query execution block to resolve the constructed queries.

## Type Parameters

### T

`T`

## Methods

### getConditions()

> **getConditions**(): `unknown`[]

Defined in: query/topheavy.ts:150

Resolves and returns the constructed query conditions tree without executing a select.

#### Returns

`unknown`[]

***

### orderBy()

> **orderBy**\<`P`\>(`path`, `direction?`): `QueryResolver`\<`T`\>

Defined in: query/topheavy.ts:135

Applies an ORDER BY sort condition.

#### Type Parameters

##### P

`P` *extends* `string`

#### Parameters

##### path

`P`

The property to order by.

##### direction?

`"asc"` \| `"desc"`

'asc' or 'desc'.

#### Returns

`QueryResolver`\<`T`\>

***

### select()

#### Call Signature

> **select**\<`P`\>(...`paths`): [`SelectResult`](../type-aliases/SelectResult.md)\<`T`, `P`\>[]

Defined in: query/topheavy.ts:141

Retrieves specific fields by their property paths.

##### Type Parameters

###### P

`P` *extends* [`Paths`](../type-aliases/Paths.md)\<`T`\>[]

##### Parameters

###### paths

...\[`...P[]`\]

##### Returns

[`SelectResult`](../type-aliases/SelectResult.md)\<`T`, `P`\>[]

#### Call Signature

> **select**\<`A`\>(`aggregate`): `A`

Defined in: query/topheavy.ts:144

Applies an aggregate function against the queried records.

##### Type Parameters

###### A

`A`

##### Parameters

###### aggregate

(`s`) => `A`

##### Returns

`A`

#### Call Signature

> **select**\<`P`, `A`\>(...`args`): [`SelectResult`](../type-aliases/SelectResult.md)\<`T`, `P`\> & `A`[]

Defined in: query/topheavy.ts:147

Retrieves mapped fields along with an aggregate function.

##### Type Parameters

###### P

`P` *extends* [`Paths`](../type-aliases/Paths.md)\<`T`\>[]

###### A

`A`

##### Parameters

###### args

...\[`...P[]`, (`s`) => `A`\]

##### Returns

[`SelectResult`](../type-aliases/SelectResult.md)\<`T`, `P`\> & `A`[]

***

### selectAll()

> **selectAll**(): `T`[]

Defined in: query/topheavy.ts:138

Retrieves all fields from the document/row.

#### Returns

`T`[]
