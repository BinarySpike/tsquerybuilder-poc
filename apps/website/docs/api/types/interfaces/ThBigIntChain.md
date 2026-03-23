[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / ThBigIntChain

# Interface: ThBigIntChain\<Null\>

Defined in: types/topheavytypes.types.ts:80

BigInt validation builder

## Extends

- [`ThBaseChain`](ThBaseChain.md)\<`bigint`, `Null`\>

## Type Parameters

### Null

`Null` = `never`

## Properties

### \_type

> `readonly` **\_type**: `bigint` \| `Null`

Defined in: types/topheavytypes.types.ts:9

**`Internal`**

phantom property for type inference

#### Inherited from

[`ThBaseChain`](ThBaseChain.md).[`_type`](ThBaseChain.md#_type)

***

### nullable

> `readonly` **nullable**: `ThBigIntChain`\<`null`\>

Defined in: types/topheavytypes.types.ts:82

Makes the BigInt validation optional (nullable).

## Methods

### gt()

> **gt**(`n`): `ThBigIntChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:85

Require greater than

#### Parameters

##### n

`bigint`

#### Returns

`ThBigIntChain`\<`Null`\>

***

### gte()

> **gte**(`n`): `ThBigIntChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:89

Require greater than or equal

#### Parameters

##### n

`bigint`

#### Returns

`ThBigIntChain`\<`Null`\>

***

### lt()

> **lt**(`n`): `ThBigIntChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:87

Require less than

#### Parameters

##### n

`bigint`

#### Returns

`ThBigIntChain`\<`Null`\>

***

### lte()

> **lte**(`n`): `ThBigIntChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:91

Require less than or equal

#### Parameters

##### n

`bigint`

#### Returns

`ThBigIntChain`\<`Null`\>

***

### multipleOf()

> **multipleOf**(`n`): `ThBigIntChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:93

Ensure multiple of

#### Parameters

##### n

`bigint`

#### Returns

`ThBigIntChain`\<`Null`\>

***

### test()

> **test**(`fn`): `this`

Defined in: types/topheavytypes.types.ts:6

#### Parameters

##### fn

(`value`) => `boolean`

#### Returns

`this`

#### Inherited from

[`ThBaseChain`](ThBaseChain.md).[`test`](ThBaseChain.md#test)

***

### validate()

> **validate**(`value`): `boolean`

Defined in: types/topheavytypes.types.ts:7

#### Parameters

##### value

`any`

#### Returns

`boolean`

#### Inherited from

[`ThBaseChain`](ThBaseChain.md).[`validate`](ThBaseChain.md#validate)
