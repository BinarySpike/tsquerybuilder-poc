[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / SelectResult

# Type Alias: SelectResult\<T, P\>

> **SelectResult**\<`T`, `P`\> = `P` *extends* \[infer First, `...(infer Rest)`\] ? `{ [K in LeafKey<First>]: PathType<T, First> }` & `SelectResult`\<`T`, `Rest`\> : `object`

Defined in: query/path.ts:29

## Type Parameters

### T

`T`

### P

`P` *extends* `any`[]
