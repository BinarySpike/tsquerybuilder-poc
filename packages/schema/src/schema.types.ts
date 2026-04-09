// ── Base chain: common to all types ──────────────────────────────────
// Null defaults to `never` (non-nullable). `.nullable` sets Null = null,
// and all chain methods propagate Null so `| null` is never lost.

export interface ThConstraint {
    name: string;
    args: any[];
}

export interface ThBaseChain<T, Null = never> {
    /** The primitive kind of this chain builder */
    readonly kind: string;
    /** Whether this field explicitly allows nulls/undefined */
    readonly isNullable: boolean;
    /** The recorded validation constraints */
    readonly constraints: ThConstraint[];

    test(fn: (value: T | Null) => boolean): Omit<this, 'nullable' | 'array'>;
    validate(value: any): boolean;
    /** @internal phantom property for type inference */
    readonly _type: T | Null;
}

// ── String chain ─────────────────────────────────────────────────────

/** String validation builder */
export interface ThStringChain<Null = never> extends ThBaseChain<string, Null> {
    /** Makes the string validation optional (nullable). */
    readonly nullable: ThStringChain<null>;
    /** Promotes this field into an array of strings, forwarding constraints to each element. */
    readonly array: ThStringArrayChain<Null>;

    // Length constraints
    /** Ensures exact length */
    len(n: number): ThStringConstrained<Null>;
    /** Ensures minimum length */
    minLen(n: number): ThStringConstrained<Null>;
    /** Ensures maximum length */
    maxLen(n: number): ThStringConstrained<Null>;

    // Content constraints
    /** Requires string to start with specific prefix */
    beginsWith(value: string): ThStringConstrained<Null>;
    /** Requires string to end with specific suffix */
    endsWith(value: string): ThStringConstrained<Null>;
    /** Requires string to contain a substring */
    contains(value: string): ThStringConstrained<Null>;
    /** Ensures string matches a regular expression */
    regex(pattern: RegExp): ThStringConstrained<Null>;

    // Tagged template literal
    /** Builds a regex pattern using template literals */
    template(strings: TemplateStringsArray, ...exprs: (ThStringChain<any> | string | number)[]): ThStringConstrained<Null>;

    // Transforms
    /** Ensures string is purely uppercase */
    uppercase(): ThStringConstrained<Null>;
    /** Ensures string is purely lowercase */
    lowercase(): ThStringConstrained<Null>;

    // Built-in formats
    /** Validates a standard email format */
    readonly email: ThStringConstrained<Null>;
}

/** String chain after a constraint has been applied — no more `.nullable` or `.array`. */
export type ThStringConstrained<Null = never> = Omit<ThStringChain<Null>, 'nullable' | 'array'>;

// ── Number chain ─────────────────────────────────────────────────────

/** Number validation builder */
export interface ThNumberChain<Null = never> extends ThBaseChain<number, Null> {
    /** Makes the number validation optional (nullable). */
    readonly nullable: ThNumberChain<null>;
    /** Promotes this field into an array of numbers, forwarding constraints to each element. */
    readonly array: ThNumberArrayChain<Null>;

    /** Require greater than */
    gt(n: number): ThNumberConstrained<Null>;
    /** Require less than */
    lt(n: number): ThNumberConstrained<Null>;
    /** Require greater than or equal */
    gte(n: number): ThNumberConstrained<Null>;
    /** Require less than or equal */
    lte(n: number): ThNumberConstrained<Null>;
    /** Ensure multiple of */
    multipleOf(n: number): ThNumberConstrained<Null>;

}

/** Number chain after a constraint has been applied — no more `.nullable` or `.array`. */
export type ThNumberConstrained<Null = never> = Omit<ThNumberChain<Null>, 'nullable' | 'array'>;

// ── BigInt chain ─────────────────────────────────────────────────────

/** BigInt validation builder */
export interface ThBigIntChain<Null = never> extends ThBaseChain<bigint, Null> {
    /** Makes the BigInt validation optional (nullable). */
    readonly nullable: ThBigIntChain<null>;
    /** Promotes this field into an array of bigints, forwarding constraints to each element. */
    readonly array: ThBigIntArrayChain<Null>;

    /** Require greater than */
    gt(n: bigint): ThBigIntConstrained<Null>;
    /** Require less than */
    lt(n: bigint): ThBigIntConstrained<Null>;
    /** Require greater than or equal */
    gte(n: bigint): ThBigIntConstrained<Null>;
    /** Require less than or equal */
    lte(n: bigint): ThBigIntConstrained<Null>;
    /** Ensure multiple of */
    multipleOf(n: bigint): ThBigIntConstrained<Null>;
}

/** BigInt chain after a constraint has been applied — no more `.nullable` or `.array`. */
export type ThBigIntConstrained<Null = never> = Omit<ThBigIntChain<Null>, 'nullable' | 'array'>;

// ── Date chain ───────────────────────────────────────────────────────

/** Date validation builder */
export interface ThDateChain<Null = never> extends ThBaseChain<Date, Null> {
    /** Makes the date validation optional (nullable). */
    readonly nullable: ThDateChain<null>;
    /** Promotes this field into an array of dates, forwarding constraints to each element. */
    readonly array: ThDateArrayChain<Null>;

    /** After this date instance */
    gt(d: Date): ThDateConstrained<Null>;
    /** Before this date instance */
    lt(d: Date): ThDateConstrained<Null>;
    /** On or after this date instance */
    gte(d: Date): ThDateConstrained<Null>;
    /** On or before this date instance */
    lte(d: Date): ThDateConstrained<Null>;

}

/** Date chain after a constraint has been applied — no more `.nullable` or `.array`. */
export type ThDateConstrained<Null = never> = Omit<ThDateChain<Null>, 'nullable' | 'array'>;

// ── Simple chains (no extra constraints) ─────────────────────────────

export interface ThBooleanChain<Null = never> extends ThBaseChain<boolean, Null> {
    readonly nullable: ThBooleanChain<null>;
    readonly array: ThPrimitiveArrayChain<ThBooleanChain<Null>>;
}
export interface ThSymbolChain<Null = never> extends ThBaseChain<symbol, Null> {
    readonly nullable: ThSymbolChain<null>;
    readonly array: ThPrimitiveArrayChain<ThSymbolChain<Null>>;
}
export interface ThUndefinedChain<Null = never> extends ThBaseChain<undefined, Null> {
    readonly nullable: ThUndefinedChain<null>;
    readonly array: ThPrimitiveArrayChain<ThUndefinedChain<Null>>;
}
export interface ThNullChain<Null = never> extends ThBaseChain<null, Null> {
    readonly nullable: ThNullChain<null>;
    readonly array: ThPrimitiveArrayChain<ThNullChain<Null>>;
}

// ── Primitive array chains ────────────────────────────────────────────
//
// Explicit per-type array chain interfaces so that element constraint
// methods return the correct array-level types (with _type: T[]) and
// omit `.nullable` after any constraint is applied.

/** Array chain for simple types with no element constraints. */
export type ThPrimitiveArrayChain<C extends ThBaseChain<any, any>, Null = never> =
    Omit<ThBaseChain<C extends ThBaseChain<infer T, infer N> ? Array<T | N> : never, Null>, 'nullable' | 'test'> & {
        readonly nullable: ThPrimitiveArrayChain<C, null>;
        test(fn: (value: (C extends ThBaseChain<infer T, infer N> ? Array<T | N> : never) | Null) => boolean):
            Omit<ThPrimitiveArrayChain<C, Null>, 'nullable'>;
    };

// ── String array chain ───────────────────────────────────────────────

export type ThStringArrayConstrained<ElementNull = never, ArrayNull = never> =
    Omit<ThStringArrayChain<ElementNull, ArrayNull>, 'nullable'>;

export interface ThStringArrayChain<ElementNull = never, ArrayNull = never> {
    readonly kind: string;
    readonly isNullable: boolean;
    readonly constraints: ThConstraint[];
    validate(value: any): boolean;
    readonly _type: Array<string | ElementNull> | ArrayNull;

    readonly nullable: ThStringArrayChain<ElementNull, null>;
    test(fn: (value: Array<string | ElementNull> | ArrayNull) => boolean): ThStringArrayConstrained<ElementNull, ArrayNull>;

    len(n: number): ThStringArrayConstrained<ElementNull, ArrayNull>;
    minLen(n: number): ThStringArrayConstrained<ElementNull, ArrayNull>;
    maxLen(n: number): ThStringArrayConstrained<ElementNull, ArrayNull>;
    beginsWith(value: string): ThStringArrayConstrained<ElementNull, ArrayNull>;
    endsWith(value: string): ThStringArrayConstrained<ElementNull, ArrayNull>;
    contains(value: string): ThStringArrayConstrained<ElementNull, ArrayNull>;
    regex(pattern: RegExp): ThStringArrayConstrained<ElementNull, ArrayNull>;
    template(strings: TemplateStringsArray, ...exprs: (ThStringChain<any> | string | number)[]): ThStringArrayConstrained<ElementNull, ArrayNull>;
    uppercase(): ThStringArrayConstrained<ElementNull, ArrayNull>;
    lowercase(): ThStringArrayConstrained<ElementNull, ArrayNull>;
    readonly email: ThStringArrayConstrained<ElementNull, ArrayNull>;
}

// ── Number array chain ───────────────────────────────────────────────

export type ThNumberArrayConstrained<ElementNull = never, ArrayNull = never> =
    Omit<ThNumberArrayChain<ElementNull, ArrayNull>, 'nullable'>;

export interface ThNumberArrayChain<ElementNull = never, ArrayNull = never> {
    readonly kind: string;
    readonly isNullable: boolean;
    readonly constraints: ThConstraint[];
    validate(value: any): boolean;
    readonly _type: Array<number | ElementNull> | ArrayNull;

    readonly nullable: ThNumberArrayChain<ElementNull, null>;
    test(fn: (value: Array<number | ElementNull> | ArrayNull) => boolean): ThNumberArrayConstrained<ElementNull, ArrayNull>;

    gt(n: number): ThNumberArrayConstrained<ElementNull, ArrayNull>;
    lt(n: number): ThNumberArrayConstrained<ElementNull, ArrayNull>;
    gte(n: number): ThNumberArrayConstrained<ElementNull, ArrayNull>;
    lte(n: number): ThNumberArrayConstrained<ElementNull, ArrayNull>;
    multipleOf(n: number): ThNumberArrayConstrained<ElementNull, ArrayNull>;
}

// ── BigInt array chain ───────────────────────────────────────────────

export type ThBigIntArrayConstrained<ElementNull = never, ArrayNull = never> =
    Omit<ThBigIntArrayChain<ElementNull, ArrayNull>, 'nullable'>;

export interface ThBigIntArrayChain<ElementNull = never, ArrayNull = never> {
    readonly kind: string;
    readonly isNullable: boolean;
    readonly constraints: ThConstraint[];
    validate(value: any): boolean;
    readonly _type: Array<bigint | ElementNull> | ArrayNull;

    readonly nullable: ThBigIntArrayChain<ElementNull, null>;
    test(fn: (value: Array<bigint | ElementNull> | ArrayNull) => boolean): ThBigIntArrayConstrained<ElementNull, ArrayNull>;

    gt(n: bigint): ThBigIntArrayConstrained<ElementNull, ArrayNull>;
    lt(n: bigint): ThBigIntArrayConstrained<ElementNull, ArrayNull>;
    gte(n: bigint): ThBigIntArrayConstrained<ElementNull, ArrayNull>;
    lte(n: bigint): ThBigIntArrayConstrained<ElementNull, ArrayNull>;
    multipleOf(n: bigint): ThBigIntArrayConstrained<ElementNull, ArrayNull>;
}

// ── Date array chain ─────────────────────────────────────────────────

export type ThDateArrayConstrained<ElementNull = never, ArrayNull = never> =
    Omit<ThDateArrayChain<ElementNull, ArrayNull>, 'nullable'>;

export interface ThDateArrayChain<ElementNull = never, ArrayNull = never> {
    readonly kind: string;
    readonly isNullable: boolean;
    readonly constraints: ThConstraint[];
    validate(value: any): boolean;
    readonly _type: Array<Date | ElementNull> | ArrayNull;

    readonly nullable: ThDateArrayChain<ElementNull, null>;
    test(fn: (value: Array<Date | ElementNull> | ArrayNull) => boolean): ThDateArrayConstrained<ElementNull, ArrayNull>;

    gt(d: Date): ThDateArrayConstrained<ElementNull, ArrayNull>;
    lt(d: Date): ThDateArrayConstrained<ElementNull, ArrayNull>;
    gte(d: Date): ThDateArrayConstrained<ElementNull, ArrayNull>;
    lte(d: Date): ThDateArrayConstrained<ElementNull, ArrayNull>;
}

// ── Valid field types (for constraining th() schemas) ────────────────

declare const __thRefBrand: unique symbol;

/** Branded type returned by t.ref() — distinguishes lazy refs from raw TypeDefinitions */
export interface ThRefField<T = unknown, S = Record<string, any>> extends TypeDefinition<T, S> {
    readonly [__thRefBrand]: true;
    readonly array: ThRefField<T[], S>;
    readonly nullable: ThRefField<T, S>;
    readonly isNullable: boolean;
}

export type ValidThField = ThBaseChain<any, any> | ThRefField<any, any> | { [key: string]: ValidThField };

// ── Type inference utilities ─────────────────────────────────────────

export type InferField<F> =
    F extends { readonly _type: infer T } ? T :
    F extends TypeDefinition<infer T, any> ? T :
    F extends { [key: string]: ValidThField } ? InferSchema<F> :
    never;

export type InferSchema<S> = {
    [K in keyof S]: InferField<S[K]>;
}

// ── TypeDefinition ───────────────────────────────────────────────────

/**
 * A constructed and executable schema definition.
 */
export interface TypeDefinition<T = unknown, S = Record<string, any>> {
    /** The underlying raw schema definition/properties. */
    readonly schema: S;
    /** Promotes this type into an array-type validation. */
    readonly array: TypeDefinition<T[], S>;
    /** @internal phantom property */
    readonly infer: T;
    /** Validates an incoming data object against this schema. */
    validate(value: unknown): value is T;
}

// ── ThType: the builder object passed to th() ────────────────────────

/**
 * The core type schema builder.
 */
export interface ThType {
    /** Starts a string validation chain. */
    readonly str: ThStringChain;
    /** Starts a string validation chain. */
    readonly string: ThStringChain;
    /** Starts a number validation chain. */
    readonly num: ThNumberChain;
    /** Starts a number validation chain. */
    readonly number: ThNumberChain;
    /** Starts a boolean validation chain. */
    readonly bool: ThBooleanChain;
    /** Starts a date validation chain. */
    readonly date: ThDateChain;
    /** Starts a symbol validation chain. */
    readonly sym: ThSymbolChain;
    /** Starts a symbol validation chain. */
    readonly symbol: ThSymbolChain;
    /** Starts a BigInt validation chain. */
    readonly bigInt: ThBigIntChain;
    /** Starts a BigInt validation chain. */
    readonly bigint: ThBigIntChain;
    /** Specifies an explicitly undefined type. */
    readonly undefined: ThUndefinedChain;
    /** Specifies an explicitly null type. */
    readonly null: ThNullChain;
    /** Validates against specific literal values (e.g. `'admin' | 'user'`). */
    literal<T extends (string | number | boolean | symbol)[]>(...values: T): ThBaseChain<T[number]>;
    /** Lazily loads an external/nested schema definition to prevent circular references. */
    ref<T, S = Record<string, any>>(fn: () => TypeDefinition<T, S>): ThRefField<T, S>;
}
