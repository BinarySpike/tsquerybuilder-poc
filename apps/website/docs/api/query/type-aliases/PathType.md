[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / PathType

# Type Alias: PathType\<T, P\>

> **PathType**\<`T`, `P`\> = `P` *extends* `` `${infer Key}.${infer Rest}` `` ? `Key` *extends* keyof `T` ? `PathType`\<`T`\[`Key`\], `Rest`\> : `never` : `P` *extends* keyof `T` ? `T`\[`P`\] : `never`

Defined in: query/path.ts:17

## Type Parameters

### T

`T`

### P

`P` *extends* `string`
