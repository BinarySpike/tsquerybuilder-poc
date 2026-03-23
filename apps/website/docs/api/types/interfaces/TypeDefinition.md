[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / TypeDefinition

# Interface: TypeDefinition\<T\>

Defined in: types/topheavytypes.types.ts:160

A constructed and executable schema definition.

## Extended by

- [`ThRefField`](ThRefField.md)

## Type Parameters

### T

`T` = `unknown`

## Properties

### array

> `readonly` **array**: `TypeDefinition`\<`T`[]\>

Defined in: types/topheavytypes.types.ts:162

Promotes this type into an array array-type validation.

***

### infer

> `readonly` **infer**: `T`

Defined in: types/topheavytypes.types.ts:164

**`Internal`**

phantom property

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
