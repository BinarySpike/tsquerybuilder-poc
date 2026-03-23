[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / ThType

# Interface: ThType

Defined in: types/topheavytypes.types.ts:174

The core type schema builder.

## Properties

### bigint

> `readonly` **bigint**: [`ThBigIntChain`](ThBigIntChain.md)

Defined in: types/topheavytypes.types.ts:194

Starts a BigInt validation chain.

***

### bigInt

> `readonly` **bigInt**: [`ThBigIntChain`](ThBigIntChain.md)

Defined in: types/topheavytypes.types.ts:192

Starts a BigInt validation chain.

***

### bool

> `readonly` **bool**: [`ThBooleanChain`](ThBooleanChain.md)

Defined in: types/topheavytypes.types.ts:184

Starts a boolean validation chain.

***

### date

> `readonly` **date**: [`ThDateChain`](ThDateChain.md)

Defined in: types/topheavytypes.types.ts:186

Starts a date validation chain.

***

### null

> `readonly` **null**: [`ThNullChain`](ThNullChain.md)

Defined in: types/topheavytypes.types.ts:198

Specifies an explicitly null type.

***

### num

> `readonly` **num**: [`ThNumberChain`](ThNumberChain.md)

Defined in: types/topheavytypes.types.ts:180

Starts a number validation chain.

***

### number

> `readonly` **number**: [`ThNumberChain`](ThNumberChain.md)

Defined in: types/topheavytypes.types.ts:182

Starts a number validation chain.

***

### str

> `readonly` **str**: [`ThStringChain`](ThStringChain.md)

Defined in: types/topheavytypes.types.ts:176

Starts a string validation chain.

***

### string

> `readonly` **string**: [`ThStringChain`](ThStringChain.md)

Defined in: types/topheavytypes.types.ts:178

Starts a string validation chain.

***

### sym

> `readonly` **sym**: [`ThSymbolChain`](ThSymbolChain.md)

Defined in: types/topheavytypes.types.ts:188

Starts a symbol validation chain.

***

### symbol

> `readonly` **symbol**: [`ThSymbolChain`](ThSymbolChain.md)

Defined in: types/topheavytypes.types.ts:190

Starts a symbol validation chain.

***

### undefined

> `readonly` **undefined**: [`ThUndefinedChain`](ThUndefinedChain.md)

Defined in: types/topheavytypes.types.ts:196

Specifies an explicitly undefined type.

## Methods

### literal()

> **literal**\<`T`\>(...`values`): [`ThBaseChain`](ThBaseChain.md)\<`T`\[`number`\]\>

Defined in: types/topheavytypes.types.ts:200

Validates against specific literal values (e.g. `'admin' | 'user'`).

#### Type Parameters

##### T

`T` *extends* (`string` \| `number` \| `boolean` \| `symbol`)[]

#### Parameters

##### values

...`T`

#### Returns

[`ThBaseChain`](ThBaseChain.md)\<`T`\[`number`\]\>

***

### ref()

> **ref**\<`T`\>(`fn`): [`ThRefField`](ThRefField.md)\<`T`\>

Defined in: types/topheavytypes.types.ts:202

Lazily loads an external/nested schema definition to prevent circular references.

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => [`TypeDefinition`](TypeDefinition.md)\<`T`\>

#### Returns

[`ThRefField`](ThRefField.md)\<`T`\>
