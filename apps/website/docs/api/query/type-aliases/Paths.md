[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [query](../README.md) / Paths

# Type Alias: Paths\<T\>

> **Paths**\<`T`\> = `T` *extends* `Date` \| `any`[] ? `never` : `T` *extends* `object` ? \{ \[K in keyof T\]: K extends string \| number ? \`$\{K\}\` \| (T\[K\] extends object ? \`$\{K\}.$\{PathsWrapper\<(...)\>\["value"\]\}\` : never) : never \}\[keyof `T`\] : `never`

Defined in: query/path.ts:9

## Type Parameters

### T

`T`
