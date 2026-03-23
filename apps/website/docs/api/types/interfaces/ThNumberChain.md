[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / ThNumberChain

# Interface: ThNumberChain\<Null\>

Defined in: types/topheavytypes.types.ts:57

Number validation builder

## Extends

- [`ThBaseChain`](ThBaseChain.md)\<`number`, `Null`\>

## Type Parameters

### Null

`Null` = `never`

## Properties

### \_type

> `readonly` **\_type**: `number` \| `Null`

Defined in: types/topheavytypes.types.ts:9

**`Internal`**

phantom property for type inference

#### Inherited from

[`ThBaseChain`](ThBaseChain.md).[`_type`](ThBaseChain.md#_type)

***

### nullable

> `readonly` **nullable**: `ThNumberChain`\<`null`\>

Defined in: types/topheavytypes.types.ts:59

Makes the number validation optional (nullable).

***

### signed

> `readonly` **signed**: `ThNumberChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:74

Explicitly allows signed integers

***

### unsigned

> `readonly` **unsigned**: `ThNumberChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:72

Ensure positive purely unsigned

## Methods

### gt()

> **gt**(`n`): `ThNumberChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:62

Require greater than

#### Parameters

##### n

`number`

#### Returns

`ThNumberChain`\<`Null`\>

***

### gte()

> **gte**(`n`): `ThNumberChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:66

Require greater than or equal

#### Parameters

##### n

`number`

#### Returns

`ThNumberChain`\<`Null`\>

***

### lt()

> **lt**(`n`): `ThNumberChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:64

Require less than

#### Parameters

##### n

`number`

#### Returns

`ThNumberChain`\<`Null`\>

***

### lte()

> **lte**(`n`): `ThNumberChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:68

Require less than or equal

#### Parameters

##### n

`number`

#### Returns

`ThNumberChain`\<`Null`\>

***

### multipleOf()

> **multipleOf**(`n`): `ThNumberChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:70

Ensure multiple of

#### Parameters

##### n

`number`

#### Returns

`ThNumberChain`\<`Null`\>

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
