[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / StringCondition

# Interface: StringCondition\<V, R\>

Defined in: query/topheavy.ts:43

Specific conditions available for textual fields

## Type Parameters

### V

`V`

### R

`R`

## Methods

### beginsWith()

> **beginsWith**(`value`): `R`

Defined in: query/topheavy.ts:45

Requires string to start with specific sequence

#### Parameters

##### value

`string`

#### Returns

`R`

***

### contains()

> **contains**(`value`): `R`

Defined in: query/topheavy.ts:49

Requires string to include the stated substring

#### Parameters

##### value

`string`

#### Returns

`R`

***

### endsWith()

> **endsWith**(`value`): `R`

Defined in: query/topheavy.ts:47

Requires string to end with specific sequence

#### Parameters

##### value

`string`

#### Returns

`R`
