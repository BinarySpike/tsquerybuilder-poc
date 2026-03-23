[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / BaseCondition

# Interface: BaseCondition\<V, R\>

Defined in: query/topheavy.ts:33

General equality methods applicable to any field

## Type Parameters

### V

`V`

### R

`R`

## Properties

### not

> `readonly` **not**: `Omit`\<[`Condition`](../type-aliases/Condition.md)\<`V`, `R`\>, `"not"`\>

Defined in: query/topheavy.ts:39

Negates the next chained condition (`NOT`)

## Methods

### in()

> **in**(`values`): `R`

Defined in: query/topheavy.ts:37

Matches if value exists in array (`IN (...)`)

#### Parameters

##### values

`V`[]

#### Returns

`R`

***

### is()

> **is**(`value`): `R`

Defined in: query/topheavy.ts:35

Strict equality (`===`)

#### Parameters

##### value

`V`

#### Returns

`R`
