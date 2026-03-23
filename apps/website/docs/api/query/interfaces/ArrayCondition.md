[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / ArrayCondition

# Interface: ArrayCondition\<V, R\>

Defined in: query/topheavy.ts:73

Structural matchers for finding elements inside array typed fields

## Type Parameters

### V

`V`

### R

`R`

## Methods

### has()

> **has**(`value`): `R`

Defined in: query/topheavy.ts:75

Contains the exact element

#### Parameters

##### value

`V` *extends* `U`[] ? `U` : `never`

#### Returns

`R`

***

### hasEvery()

> **hasEvery**(`values`): `R`

Defined in: query/topheavy.ts:79

Contains all of the provided elements

#### Parameters

##### values

`V` *extends* `U`[] ? `U`[] : `never`

#### Returns

`R`

***

### hasSome()

> **hasSome**(`values`): `R`

Defined in: query/topheavy.ts:77

Contains at least one of the provided elements

#### Parameters

##### values

`V` *extends* `U`[] ? `U`[] : `never`

#### Returns

`R`
