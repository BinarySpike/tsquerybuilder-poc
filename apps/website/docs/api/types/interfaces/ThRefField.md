[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / ThRefField

# Interface: ThRefField\<T\>

Defined in: types/topheavytypes.types.ts:137

Branded type returned by t.ref() — distinguishes lazy refs from raw TypeDefinitions

## Extends

- [`TypeDefinition`](TypeDefinition.md)\<`T`\>

## Type Parameters

### T

`T` = `unknown`

## Properties

### \[\_\_\_thRefBrand\]

> `readonly` **\[\_\_\_thRefBrand\]**: `true`

Defined in: types/topheavytypes.types.ts:138

***

### array

> `readonly` **array**: `ThRefField`\<`T`[]\>

Defined in: types/topheavytypes.types.ts:139

Promotes this type into an array array-type validation.

#### Overrides

[`TypeDefinition`](TypeDefinition.md).[`array`](TypeDefinition.md#array)

***

### infer

> `readonly` **infer**: `T`

Defined in: types/topheavytypes.types.ts:164

**`Internal`**

phantom property

#### Inherited from

[`TypeDefinition`](TypeDefinition.md).[`infer`](TypeDefinition.md#infer)

## Methods

### validate()

> **validate**(`value`): `boolean`

Defined in: types/topheavytypes.types.ts:166

Validates an incoming data object against this schema.

#### Parameters

##### value

`T`

#### Returns

`boolean`

#### Inherited from

[`TypeDefinition`](TypeDefinition.md).[`validate`](TypeDefinition.md#validate)
