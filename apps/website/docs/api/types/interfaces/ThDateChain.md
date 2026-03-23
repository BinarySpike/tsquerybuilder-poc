[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / ThDateChain

# Interface: ThDateChain\<Null\>

Defined in: types/topheavytypes.types.ts:99

Date validation builder

## Extends

- [`ThBaseChain`](ThBaseChain.md)\<`Date`, `Null`\>

## Type Parameters

### Null

`Null` = `never`

## Properties

### \_type

> `readonly` **\_type**: `Date` \| `Null`

Defined in: types/topheavytypes.types.ts:9

**`Internal`**

phantom property for type inference

#### Inherited from

[`ThBaseChain`](ThBaseChain.md).[`_type`](ThBaseChain.md#_type)

***

### nullable

> `readonly` **nullable**: `ThDateChain`\<`null`\>

Defined in: types/topheavytypes.types.ts:101

Makes the date validation optional (nullable).

## Methods

### gt()

> **gt**(`d`): `ThDateChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:104

After this date instance

#### Parameters

##### d

`Date`

#### Returns

`ThDateChain`\<`Null`\>

***

### gte()

> **gte**(`d`): `ThDateChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:108

On or after this date instance

#### Parameters

##### d

`Date`

#### Returns

`ThDateChain`\<`Null`\>

***

### lt()

> **lt**(`d`): `ThDateChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:106

Before this date instance

#### Parameters

##### d

`Date`

#### Returns

`ThDateChain`\<`Null`\>

***

### lte()

> **lte**(`d`): `ThDateChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:110

On or before this date instance

#### Parameters

##### d

`Date`

#### Returns

`ThDateChain`\<`Null`\>

***

### max()

> **max**(`dateStr`): `ThDateChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:114

Maximum date string parsed

#### Parameters

##### dateStr

`string`

#### Returns

`ThDateChain`\<`Null`\>

***

### min()

> **min**(`dateStr`): `ThDateChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:112

Minimum date string parsed

#### Parameters

##### dateStr

`string`

#### Returns

`ThDateChain`\<`Null`\>

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
