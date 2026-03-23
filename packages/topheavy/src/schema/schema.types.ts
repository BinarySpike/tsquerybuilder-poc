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

    test(fn: (value: T | Null) => boolean): this;
    validate(value: any): boolean;
    /** @internal phantom property for type inference */
    readonly _type: T | Null;
}

// ── String chain ─────────────────────────────────────────────────────

/** String validation builder */
export interface ThStringChain<Null = never> extends ThBaseChain<string, Null> {
    /** Makes the string validation optional (nullable). */
    readonly nullable: ThStringChain<null>;

    // Length constraints
    /** Ensures exact length */
    len(n: number): ThStringChain<Null>;
    /** Ensures exact length */
    length(n: number): ThStringChain<Null>;
    /** Ensures minimum length */
    minLen(n: number): ThStringChain<Null>;
    /** Ensures maximum length */
    maxLen(n: number): ThStringChain<Null>;

    // Content constraints
    /** Requires string to start with specific prefix */
    beginsWith(value: string): ThStringChain<Null>;
    /** Requires string to end with specific suffix */
    endsWith(value: string): ThStringChain<Null>;
    /** Requires string to contain a substring */
    contains(value: string): ThStringChain<Null>;
    /** Ensures string matches a regular expression */
    regex(pattern: RegExp): ThStringChain<Null>;

    // Tagged template literal
    /** Builds a regex pattern using template literals */
    template(strings: TemplateStringsArray, ...exprs: ThStringChain<any>[]): ThStringChain<Null>;

    // Transforms
    /** Ensures string is purely uppercase */
    uppercase(): ThStringChain<Null>;
    /** Ensures string is purely lowercase */
    lowercase(): ThStringChain<Null>;

    // Built-in formats
    /** Validates a standard email format */
    readonly email: ThStringChain<Null>;
}

// ── Number chain ─────────────────────────────────────────────────────

/** Number validation builder */
export interface ThNumberChain<Null = never> extends ThBaseChain<number, Null> {
    /** Makes the number validation optional (nullable). */
    readonly nullable: ThNumberChain<null>;

    /** Require greater than */
    gt(n: number): ThNumberChain<Null>;
    /** Require less than */
    lt(n: number): ThNumberChain<Null>;
    /** Require greater than or equal */
    gte(n: number): ThNumberChain<Null>;
    /** Require less than or equal */
    lte(n: number): ThNumberChain<Null>;
    /** Ensure multiple of */
    multipleOf(n: number): ThNumberChain<Null>;
    /** Ensure positive purely unsigned */
    readonly unsigned: ThNumberChain<Null>;
    /** Explicitly allows signed integers */
    readonly signed: ThNumberChain<Null>;
}

// ── BigInt chain ─────────────────────────────────────────────────────

/** BigInt validation builder */
export interface ThBigIntChain<Null = never> extends ThBaseChain<bigint, Null> {
    /** Makes the BigInt validation optional (nullable). */
    readonly nullable: ThBigIntChain<null>;

    /** Require greater than */
    gt(n: bigint): ThBigIntChain<Null>;
    /** Require less than */
    lt(n: bigint): ThBigIntChain<Null>;
    /** Require greater than or equal */
    gte(n: bigint): ThBigIntChain<Null>;
    /** Require less than or equal */
    lte(n: bigint): ThBigIntChain<Null>;
    /** Ensure multiple of */
    multipleOf(n: bigint): ThBigIntChain<Null>;
}

// ── Date chain ───────────────────────────────────────────────────────

/** Date validation builder */
export interface ThDateChain<Null = never> extends ThBaseChain<Date, Null> {
    /** Makes the date validation optional (nullable). */
    readonly nullable: ThDateChain<null>;

    /** After this date instance */
    gt(d: Date): ThDateChain<Null>;
    /** Before this date instance */
    lt(d: Date): ThDateChain<Null>;
    /** On or after this date instance */
    gte(d: Date): ThDateChain<Null>;
    /** On or before this date instance */
    lte(d: Date): ThDateChain<Null>;
    /** Minimum date string parsed */
    min(dateStr: string): ThDateChain<Null>;
    /** Maximum date string parsed */
    max(dateStr: string): ThDateChain<Null>;
}

// ── Simple chains (no extra constraints) ─────────────────────────────

export interface ThBooleanChain<Null = never> extends ThBaseChain<boolean, Null> {
    readonly nullable: ThBooleanChain<null>;
}
export interface ThSymbolChain<Null = never> extends ThBaseChain<symbol, Null> {
    readonly nullable: ThSymbolChain<null>;
}
export interface ThUndefinedChain<Null = never> extends ThBaseChain<undefined, Null> {
    readonly nullable: ThUndefinedChain<null>;
}
export interface ThNullChain<Null = never> extends ThBaseChain<null, Null> {
    readonly nullable: ThNullChain<null>;
}

// ── Valid field types (for constraining th() schemas) ────────────────

declare const __thRefBrand: unique symbol;

/** Branded type returned by t.ref() — distinguishes lazy refs from raw TypeDefinitions */
export interface ThRefField<T = unknown, S = Record<string, any>> extends TypeDefinition<T, S> {
    readonly [__thRefBrand]: true;
    readonly array: ThRefField<T[], S>;
}

export type ValidThField = ThBaseChain<any, any> | ThRefField<any, any>;

// ── Type inference utilities ─────────────────────────────────────────

export type InferField<F> =
    F extends { readonly _type: infer T } ? T :
    F extends TypeDefinition<infer T, any> ? T :
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
    readonly _schema: S;
    /** Promotes this type into an array array-type validation. */
    readonly array: TypeDefinition<T[], S>;
    /** @internal phantom property */
    readonly infer: T;
    /** Validates an incoming data object against this schema. */
    validate(value: T): boolean;
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
