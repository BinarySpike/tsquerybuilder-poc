[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / Condition

# Type Alias: Condition\<V, R\>

> **Condition**\<`V`, `R`\> = [`BaseCondition`](../interfaces/BaseCondition.md)\<`V`, `R`\> & `V` *extends* `string` ? [`StringCondition`](../interfaces/StringCondition.md)\<`V`, `R`\> : `object` & `V` *extends* `number` ? [`NumberCondition`](../interfaces/NumberCondition.md)\<`V`, `R`\> : `object` & `V` *extends* `Date` ? [`DateCondition`](../interfaces/DateCondition.md)\<`V`, `R`\> : `object` & `V` *extends* `any`[] ? [`ArrayCondition`](../interfaces/ArrayCondition.md)\<`V`, `R`\> : `object`

Defined in: query/topheavy.ts:82

## Type Parameters

### V

`V`

### R

`R`
