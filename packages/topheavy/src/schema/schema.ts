import type {
    ThStringChain,
    ThNumberChain,
    ThBigIntChain,
    ThDateChain,
    ThBooleanChain,
    ThSymbolChain,
    ThUndefinedChain,
    ThNullChain,
    ThBaseChain,
    TypeDefinition,
    ThRefField,
    ThType,
    InferSchema,
    ValidThField,
    ThConstraint,
} from './schema.types';

// ══════════════════════════════════════════════════════════════════════
// Runtime Implementation
// ══════════════════════════════════════════════════════════════════════

type ValidatorFn = (value: any) => boolean;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── BaseChainBuilder ─────────────────────────────────────────────────

class BaseChainBuilder {
    validators: ValidatorFn[] = [];
    constraints: ThConstraint[] = [];
    isNullable = false;
    kind: string = 'unknown';

    /** @internal phantom — only meaningful at the type level */
    declare readonly _type: unknown;

    protected _clone(): this {
        const clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        clone.validators = [...this.validators];
        clone.constraints = [...this.constraints];
        return clone;
    }

    validate(value: any): boolean {
        if (this.isNullable && (value === null || value === undefined)) return true;
        return this.validators.every(fn => fn(value));
    }

    get nullable(): any {
        const clone = this._clone();
        clone.isNullable = true;
        return clone;
    }

    test(fn: ValidatorFn): this {
        const clone = this._clone();
        clone.validators.push(fn);
        return clone;
    }
}

// ── StringChainBuilder ───────────────────────────────────────────────

class StringChainBuilder extends BaseChainBuilder implements ThStringChain {
    declare readonly _type: string;
    kind = 'string';

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'string');
    }

    get nullable(): ThStringChain<null> {
        return super.nullable as unknown as ThStringChain<null>;
    }

    len(n: number): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'len', args: [n] });
        clone.validators.push((v: any) => v.length === n);
        return clone;
    }

    length(n: number): this {
        return this.len(n);
    }

    minLen(n: number): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'minLen', args: [n] });
        clone.validators.push((v: any) => v.length >= n);
        return clone;
    }

    maxLen(n: number): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'maxLen', args: [n] });
        clone.validators.push((v: any) => v.length <= n);
        return clone;
    }

    beginsWith(s: string): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'beginsWith', args: [s] });
        clone.validators.push((v: any) => v.startsWith(s));
        return clone;
    }

    endsWith(s: string): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'endsWith', args: [s] });
        clone.validators.push((v: any) => v.endsWith(s));
        return clone;
    }

    contains(s: string): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'contains', args: [s] });
        clone.validators.push((v: any) => v.includes(s));
        return clone;
    }

    regex(pattern: RegExp): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'regex', args: [pattern] });
        clone.validators.push((v: any) => pattern.test(v));
        return clone;
    }

    template(strings: TemplateStringsArray, ...exprs: any[]): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'template', args: [strings, ...exprs] });
        let pattern = '^';
        for (let i = 0; i < strings.length; i++) {
            pattern += strings[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (i < exprs.length) pattern += '.*';
        }
        pattern += '$';
        const regex = new RegExp(pattern);
        clone.validators.push((v: any) => regex.test(v));
        return clone;
    }

    uppercase(): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'uppercase', args: [] });
        clone.validators.push((v: any) => v === v.toUpperCase());
        return clone;
    }

    lowercase(): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'lowercase', args: [] });
        clone.validators.push((v: any) => v === v.toLowerCase());
        return clone;
    }

    get email(): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'email', args: [] });
        clone.validators.push((v: any) => EMAIL_REGEX.test(v));
        return clone;
    }
}

// ── NumberChainBuilder ───────────────────────────────────────────────

class NumberChainBuilder extends BaseChainBuilder implements ThNumberChain {
    declare readonly _type: number;
    kind = 'number';

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'number' && !Number.isNaN(v));
    }

    get nullable(): ThNumberChain<null> {
        return super.nullable as unknown as ThNumberChain<null>;
    }

    gt(n: number): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'gt', args: [n] });
        clone.validators.push((v: any) => v > n);
        return clone;
    }

    lt(n: number): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'lt', args: [n] });
        clone.validators.push((v: any) => v < n);
        return clone;
    }

    gte(n: number): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'gte', args: [n] });
        clone.validators.push((v: any) => v >= n);
        return clone;
    }

    lte(n: number): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'lte', args: [n] });
        clone.validators.push((v: any) => v <= n);
        return clone;
    }

    multipleOf(n: number): this {
        if (!Number.isInteger(n)) throw new TypeError('multipleOf requires an integer argument');
        const clone = this._clone();
        clone.constraints.push({ name: 'multipleOf', args: [n] });
        clone.validators.push((v: any) => Number.isInteger(v) && v % n === 0);
        return clone;
    }

    get unsigned(): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'unsigned', args: [] });
        clone.validators.push((v: any) => v >= 0);
        return clone;
    }

    get signed(): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'signed', args: [] });
        clone.validators.push((v: any) => Number.isFinite(v));
        return clone;
    }
}

// ── BigIntChainBuilder ───────────────────────────────────────────────

class BigIntChainBuilder extends BaseChainBuilder implements ThBigIntChain {
    declare readonly _type: bigint;
    kind = 'bigint';

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'bigint');
    }

    get nullable(): ThBigIntChain<null> {
        return super.nullable as unknown as ThBigIntChain<null>;
    }

    gt(n: bigint): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'gt', args: [n] });
        clone.validators.push((v: any) => v > n);
        return clone;
    }

    lt(n: bigint): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'lt', args: [n] });
        clone.validators.push((v: any) => v < n);
        return clone;
    }

    gte(n: bigint): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'gte', args: [n] });
        clone.validators.push((v: any) => v >= n);
        return clone;
    }

    lte(n: bigint): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'lte', args: [n] });
        clone.validators.push((v: any) => v <= n);
        return clone;
    }

    multipleOf(n: bigint): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'multipleOf', args: [n] });
        clone.validators.push((v: any) => v % n === 0n);
        return clone;
    }
}

// ── DateChainBuilder ─────────────────────────────────────────────────

class DateChainBuilder extends BaseChainBuilder implements ThDateChain {
    declare readonly _type: Date;
    kind = 'date';

    constructor() {
        super();
        this.validators.push((v: any) => v instanceof Date && !Number.isNaN(v.valueOf()));
    }

    get nullable(): ThDateChain<null> {
        return super.nullable as unknown as ThDateChain<null>;
    }

    gt(d: Date): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'gt', args: [d] });
        clone.validators.push((v: any) => v > d);
        return clone;
    }

    lt(d: Date): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'lt', args: [d] });
        clone.validators.push((v: any) => v < d);
        return clone;
    }

    gte(d: Date): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'gte', args: [d] });
        clone.validators.push((v: any) => v >= d);
        return clone;
    }

    lte(d: Date): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'lte', args: [d] });
        clone.validators.push((v: any) => v <= d);
        return clone;
    }

    min(d: Date): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'min', args: [d] });
        clone.validators.push((v: any) => v >= d);
        return clone;
    }

    max(d: Date): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'max', args: [d] });
        clone.validators.push((v: any) => v <= d);
        return clone;
    }
}

// ── Simple chain builders ────────────────────────────────────────────

class BooleanChainBuilder extends BaseChainBuilder implements ThBooleanChain {
    declare readonly _type: boolean;
    kind = 'boolean';

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'boolean');
    }

    get nullable(): ThBooleanChain<null> {
        return super.nullable as unknown as ThBooleanChain<null>;
    }
}

class SymbolChainBuilder extends BaseChainBuilder implements ThSymbolChain {
    declare readonly _type: symbol;
    kind = 'symbol';

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'symbol');
    }

    get nullable(): ThSymbolChain<null> {
        return super.nullable as unknown as ThSymbolChain<null>;
    }
}

class UndefinedChainBuilder extends BaseChainBuilder implements ThUndefinedChain {
    declare readonly _type: undefined;
    kind = 'undefined';

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'undefined');
    }

    get nullable(): ThUndefinedChain<null> {
        return super.nullable as unknown as ThUndefinedChain<null>;
    }
}

class NullChainBuilder extends BaseChainBuilder implements ThNullChain {
    declare readonly _type: null;
    kind = 'null';

    constructor() {
        super();
        this.validators.push((v: any) => v === null);
    }

    get nullable(): ThNullChain<null> {
        return super.nullable as unknown as ThNullChain<null>;
    }
}

// ── LiteralChainBuilder ─────────────────────────────────────────────

class LiteralChainBuilder extends BaseChainBuilder {
    kind = 'literal';
    values: any[];

    constructor(values: any[]) {
        super();
        this.values = values;
        this.constraints.push({ name: 'literal', args: values });
        this.validators.push((v: any) => values.includes(v));
    }
}

// ── RefTypeDefinition ────────────────────────────────────────────────

class RefTypeDefinition {
    private _resolve: () => any;
    private _resolved: TypeDefinitionImpl | null = null;
    private _isArray: boolean;

    constructor(resolve: () => any, isArray = false) {
        this._resolve = resolve;
        this._isArray = isArray;
    }

    private _get(): TypeDefinitionImpl {
        if (!this._resolved) {
            this._resolved = this._resolve() as TypeDefinitionImpl;
        }
        return this._resolved;
    }

    get array(): RefTypeDefinition {
        return new RefTypeDefinition(this._resolve, true);
    }

    get infer(): any {
        return undefined; // phantom — only meaningful at the type level
    }

    get schema(): Record<string, BaseChainBuilder | TypeDefinitionImpl | RefTypeDefinition> {
        return this._get().schema;
    }

    validate(value: any): boolean {
        const inner = this._get();
        if (this._isArray) {
            if (!Array.isArray(value)) return false;
            return value.every((item: any) => inner.validate(item));
        }
        return inner.validate(value);
    }
}

// ── TypeDefinitionImpl ───────────────────────────────────────────────

class TypeDefinitionImpl implements TypeDefinition {
    readonly schema: Record<string, BaseChainBuilder | TypeDefinitionImpl | RefTypeDefinition>;
    private _isArray: boolean;

    constructor(schema: Record<string, BaseChainBuilder | TypeDefinitionImpl | RefTypeDefinition> = {}, isArray = false) {
        this.schema = schema;
        this._isArray = isArray;
    }

    get array(): TypeDefinitionImpl {
        return new TypeDefinitionImpl(this.schema, true);
    }

    get infer(): any {
        return undefined; // phantom — only meaningful at the type level
    }

    validate(value: unknown): value is any {
        if (this._isArray) {
            if (!Array.isArray(value)) return false;
            return value.every((item: any) => this._validateObject(item));
        }
        return this._validateObject(value);
    }

    private _validateObject(value: any): boolean {
        if (typeof value !== 'object' || value === null) return false;

        const schemaKeys = new Set(Object.keys(this.schema));

        // Reject extra keys not defined in the schema
        for (const key of Object.keys(value)) {
            if (!schemaKeys.has(key)) return false;
        }

        // Validate each schema-defined field
        for (const [key, chain] of Object.entries(this.schema)) {
            if (!('validate' in chain && typeof chain.validate === 'function')) continue;

            if (!(key in value)) {
                // Missing key: only allowed if the field is nullable
                if (chain instanceof BaseChainBuilder && chain.isNullable) continue;
                return false;
            }

            if (!chain.validate(value[key])) return false;
        }
        return true;
    }
}

// ── createThType ─────────────────────────────────────────────────────

function createThType(): ThType {
    const t: ThType = {
        get str() { return new StringChainBuilder() as ThType['str']; },
        get string() { return new StringChainBuilder() as ThType['string']; },
        get num() { return new NumberChainBuilder() as ThType['num']; },
        get number() { return new NumberChainBuilder() as ThType['number']; },
        get bool() { return new BooleanChainBuilder() as ThType['bool']; },
        get date() { return new DateChainBuilder() as ThType['date']; },
        get sym() { return new SymbolChainBuilder() as ThType['sym']; },
        get symbol() { return new SymbolChainBuilder() as ThType['symbol']; },
        get bigInt() { return new BigIntChainBuilder() as ThType['bigInt']; },
        get bigint() { return new BigIntChainBuilder() as ThType['bigint']; },
        get undefined() { return new UndefinedChainBuilder() as ThType['undefined']; },
        get null() { return new NullChainBuilder() as ThType['null']; },
        literal(...values: any[]) {
            return new LiteralChainBuilder(values) as unknown as ReturnType<ThType['literal']>;
        },
        ref(fn: () => any) {
            return new RefTypeDefinition(fn) as any;
        },
    };
    return t;
}

// ── th() factory ─────────────────────────────────────────────────────

/**
 * Creates a new TopHeavy type schema.
 * @param cb - A callback providing the root type builder instance.
 * @returns A TypeDefinition matching the generated schema signature.
 * @example
 * ```ts
 * const userSchema = schema(t => ({
 *   name: t.string().minLen(3),
 *   age: t.number().gte(18)
 * }));
 * ```
 */
export function schema<S extends Record<string, ValidThField> | void>(
    cb: (t: ThType) => S
): TypeDefinition<
    S extends Record<string, ValidThField> ? InferSchema<S> : unknown,
    S extends Record<string, ValidThField> ? S : Record<string, any>
> {
    const t = createThType();
    const schemaObj = cb(t);
    return new TypeDefinitionImpl((schemaObj ?? {}) as any) as any;
}
