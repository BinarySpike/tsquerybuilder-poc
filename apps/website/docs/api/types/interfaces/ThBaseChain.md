[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / ThBaseChain

# Interface: ThBaseChain\<T, Null\>

Defined in: types/topheavytypes.types.ts:5

## Extended by

- [`ThStringChain`](ThStringChain.md)
- [`ThNumberChain`](ThNumberChain.md)
- [`ThBigIntChain`](ThBigIntChain.md)
- [`ThDateChain`](ThDateChain.md)
- [`ThBooleanChain`](ThBooleanChain.md)
- [`ThSymbolChain`](ThSymbolChain.md)
- [`ThUndefinedChain`](ThUndefinedChain.md)
- [`ThNullChain`](ThNullChain.md)

## Type Parameters

### T

`T`

### Null

`Null` = `never`

## Properties

### \_type

> `readonly` **\_type**: `T` \| `Null`

Defined in: types/topheavytypes.types.ts:9

**`Internal`**

phantom property for type inference

## Methods

### test()

> **test**(`fn`): `this`

Defined in: types/topheavytypes.types.ts:6

#### Parameters

##### fn

(`value`) => `boolean`

#### Returns

`this`

***

### validate()

> **validate**(`value`): `boolean`

Defined in: types/topheavytypes.types.ts:7

#### Parameters

##### value

`any`

#### Returns

`boolean`
