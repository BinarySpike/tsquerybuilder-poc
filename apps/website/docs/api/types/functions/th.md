[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / th

# Function: th()

> **th**\<`S`\>(`cb`): [`TypeDefinition`](../interfaces/TypeDefinition.md)\<`S` *extends* `Record`\<`string`, [`ValidThField`](../type-aliases/ValidThField.md)\> ? [`InferSchema`](../type-aliases/InferSchema.md)\<`S`\> : `unknown`\>

Defined in: types/topheavytypes.ts:416

Creates a new TopHeavy type schema.

## Type Parameters

### S

`S` *extends* `void` \| `Record`\<`string`, [`ValidThField`](../type-aliases/ValidThField.md)\>

## Parameters

### cb

(`t`) => `S`

A callback providing the root type builder instance.

## Returns

[`TypeDefinition`](../interfaces/TypeDefinition.md)\<`S` *extends* `Record`\<`string`, [`ValidThField`](../type-aliases/ValidThField.md)\> ? [`InferSchema`](../type-aliases/InferSchema.md)\<`S`\> : `unknown`\>

A TypeDefinition matching the generated schema signature.

## Example

```ts
const userSchema = th(t => ({
  name: t.string().minLen(3),
  age: t.number().gte(18)
}));
```
