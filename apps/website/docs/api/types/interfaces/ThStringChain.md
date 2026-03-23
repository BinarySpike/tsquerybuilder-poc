[**TopHeavy API**](../../README.md)

***

[TopHeavy API](../../README.md) / [types](../README.md) / ThStringChain

# Interface: ThStringChain\<Null\>

Defined in: types/topheavytypes.types.ts:15

String validation builder

## Extends

- [`ThBaseChain`](ThBaseChain.md)\<`string`, `Null`\>

## Type Parameters

### Null

`Null` = `never`

## Properties

### \_type

> `readonly` **\_type**: `string` \| `Null`

Defined in: types/topheavytypes.types.ts:9

**`Internal`**

phantom property for type inference

#### Inherited from

[`ThBaseChain`](ThBaseChain.md).[`_type`](ThBaseChain.md#_type)

***

### email

> `readonly` **email**: `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:51

Validates a standard email format

***

### nullable

> `readonly` **nullable**: `ThStringChain`\<`null`\>

Defined in: types/topheavytypes.types.ts:17

Makes the string validation optional (nullable).

## Methods

### beginsWith()

> **beginsWith**(`value`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:31

Requires string to start with specific prefix

#### Parameters

##### value

`string`

#### Returns

`ThStringChain`\<`Null`\>

***

### contains()

> **contains**(`value`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:35

Requires string to contain a substring

#### Parameters

##### value

`string`

#### Returns

`ThStringChain`\<`Null`\>

***

### endsWith()

> **endsWith**(`value`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:33

Requires string to end with specific suffix

#### Parameters

##### value

`string`

#### Returns

`ThStringChain`\<`Null`\>

***

### len()

> **len**(`n`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:21

Ensures exact length

#### Parameters

##### n

`number`

#### Returns

`ThStringChain`\<`Null`\>

***

### length()

> **length**(`n`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:23

Ensures exact length

#### Parameters

##### n

`number`

#### Returns

`ThStringChain`\<`Null`\>

***

### lowercase()

> **lowercase**(): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:47

Ensures string is purely lowercase

#### Returns

`ThStringChain`\<`Null`\>

***

### maxLen()

> **maxLen**(`n`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:27

Ensures maximum length

#### Parameters

##### n

`number`

#### Returns

`ThStringChain`\<`Null`\>

***

### minLen()

> **minLen**(`n`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:25

Ensures minimum length

#### Parameters

##### n

`number`

#### Returns

`ThStringChain`\<`Null`\>

***

### regex()

> **regex**(`pattern`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:37

Ensures string matches a regular expression

#### Parameters

##### pattern

`RegExp`

#### Returns

`ThStringChain`\<`Null`\>

***

### template()

> **template**(`strings`, ...`exprs`): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:41

Builds a regex pattern using template literals

#### Parameters

##### strings

`TemplateStringsArray`

##### exprs

...`ThStringChain`\<`any`\>[]

#### Returns

`ThStringChain`\<`Null`\>

***

### test()

> **test**(`fn`): `this`

Defined in: types/topheavytypes.types.ts:6

#### Parameters

##### fn

(`value`) => `boolean`

#### Returns

`this`

#### Inherited from

[`ThBaseChain`](ThBaseChain.md).[`test`](ThBaseChain.md#test)

***

### uppercase()

> **uppercase**(): `ThStringChain`\<`Null`\>

Defined in: types/topheavytypes.types.ts:45

Ensures string is purely uppercase

#### Returns

`ThStringChain`\<`Null`\>

***

### validate()

> **validate**(`value`): `boolean`

Defined in: types/topheavytypes.types.ts:7

#### Parameters

##### value

`any`

#### Returns

`boolean`

#### Inherited from

[`ThBaseChain`](ThBaseChain.md).[`validate`](ThBaseChain.md#validate)
