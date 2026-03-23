[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / NumberCondition

# Interface: NumberCondition\<V, R\>

Defined in: query/topheavy.ts:53

Mathematical inequalities available for numeric fields

## Type Parameters

### V

`V`

### R

`R`

## Methods

### between()

> **between**(`min`, `max`, `inclusive?`): `R`

Defined in: query/topheavy.ts:59

Range inclusion (inclusive by default)

#### Parameters

##### min

`number`

##### max

`number`

##### inclusive?

`boolean`

#### Returns

`R`

***

### greaterThan()

> **greaterThan**(`value`): `R`

Defined in: query/topheavy.ts:55

Strict greater than (`>`)

#### Parameters

##### value

`number`

#### Returns

`R`

***

### lessThan()

> **lessThan**(`value`): `R`

Defined in: query/topheavy.ts:57

Strict less than (`<`)

#### Parameters

##### value

`number`

#### Returns

`R`
