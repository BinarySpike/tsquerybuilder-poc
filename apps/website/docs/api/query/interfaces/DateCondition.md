[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / DateCondition

# Interface: DateCondition\<V, R\>

Defined in: query/topheavy.ts:63

Chronological constraint operators available for date fields

## Type Parameters

### V

`V`

### R

`R`

## Methods

### after()

> **after**(`value`): `R`

Defined in: query/topheavy.ts:67

Must occur strictly after the target date

#### Parameters

##### value

`Date`

#### Returns

`R`

***

### before()

> **before**(`value`): `R`

Defined in: query/topheavy.ts:65

Must occur strictly before the target date

#### Parameters

##### value

`Date`

#### Returns

`R`

***

### between()

> **between**(`start`, `end`, `inclusive?`): `R`

Defined in: query/topheavy.ts:69

Range inclusion constraint for date comparisons

#### Parameters

##### start

`Date`

##### end

`Date`

##### inclusive?

`boolean`

#### Returns

`R`
