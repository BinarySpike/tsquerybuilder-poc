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

    validate(value: any): boolean {
        if (this.isNullable && (value === null || value === undefined)) return true;
        return this.validators.every(fn => fn(value));
    }

    get nullable(): this {
        this.isNullable = true;
        return this;
    }

    test(fn: ValidatorFn): this {
        this.validators.push(fn);
        return this;
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

    len(n: number): this {
        this.constraints.push({ name: 'len', args: [n] });
        this.validators.push((v: any) => v.length === n);
        return this;
    }

    length(n: number): this {
        this.constraints.push({ name: 'length', args: [n] });
        this.validators.push((v: any) => v.length === n);
        return this;
    }

    minLen(n: number): this {
        this.constraints.push({ name: 'minLen', args: [n] });
        this.validators.push((v: any) => v.length >= n);
        return this;
    }

    maxLen(n: number): this {
        this.constraints.push({ name: 'maxLen', args: [n] });
        this.validators.push((v: any) => v.length <= n);
        return this;
    }

    beginsWith(s: string): this {
        this.constraints.push({ name: 'beginsWith', args: [s] });
        this.validators.push((v: any) => v.startsWith(s));
        return this;
    }

    endsWith(s: string): this {
        this.constraints.push({ name: 'endsWith', args: [s] });
        this.validators.push((v: any) => v.endsWith(s));
        return this;
    }

    contains(s: string): this {
        this.constraints.push({ name: 'contains', args: [s] });
        this.validators.push((v: any) => v.includes(s));
        return this;
    }

    regex(pattern: RegExp): this {
        this.constraints.push({ name: 'regex', args: [pattern] });
        this.validators.push((v: any) => pattern.test(v));
        return this;
    }

    template(strings: TemplateStringsArray, ...exprs: any[]): this {
        this.constraints.push({ name: 'template', args: [strings, ...exprs] });
        let pattern = '^';
        for (let i = 0; i < strings.length; i++) {
            pattern += strings[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (i < exprs.length) pattern += '.*';
        }
        pattern += '$';
        const regex = new RegExp(pattern);
        this.validators.push((v: any) => regex.test(v));
        return this;
    }

    uppercase(): this {
        this.constraints.push({ name: 'uppercase', args: [] });
        this.validators.push((v: any) => v === v.toUpperCase());
        return this;
    }

    lowercase(): this {
        this.constraints.push({ name: 'lowercase', args: [] });
        this.validators.push((v: any) => v === v.toLowerCase());
        return this;
    }

    get email(): this {
        this.constraints.push({ name: 'email', args: [] });
        this.validators.push((v: any) => EMAIL_REGEX.test(v));
        return this;
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

    gt(n: number): this {
        this.constraints.push({ name: 'gt', args: [n] });
        this.validators.push((v: any) => v > n);
        return this;
    }

    lt(n: number): this {
        this.constraints.push({ name: 'lt', args: [n] });
        this.validators.push((v: any) => v < n);
        return this;
    }

    gte(n: number): this {
        this.constraints.push({ name: 'gte', args: [n] });
        this.validators.push((v: any) => v >= n);
        return this;
    }

    lte(n: number): this {
        this.constraints.push({ name: 'lte', args: [n] });
        this.validators.push((v: any) => v <= n);
        return this;
    }

    multipleOf(n: number): this {
        this.constraints.push({ name: 'multipleOf', args: [n] });
        this.validators.push((v: any) => v % n === 0);
        return this;
    }

    get unsigned(): this {
        this.constraints.push({ name: 'unsigned', args: [] });
        this.validators.push((v: any) => v >= 0);
        return this;
    }

    get signed(): this {
        this.constraints.push({ name: 'signed', args: [] });
        this.validators.push((v: any) => typeof v === 'number');
        return this;
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

    gt(n: bigint): this {
        this.constraints.push({ name: 'gt', args: [n] });
        this.validators.push((v: any) => v > n);
        return this;
    }

    lt(n: bigint): this {
        this.constraints.push({ name: 'lt', args: [n] });
        this.validators.push((v: any) => v < n);
        return this;
    }

    gte(n: bigint): this {
        this.constraints.push({ name: 'gte', args: [n] });
        this.validators.push((v: any) => v >= n);
        return this;
    }

    lte(n: bigint): this {
        this.constraints.push({ name: 'lte', args: [n] });
        this.validators.push((v: any) => v <= n);
        return this;
    }

    multipleOf(n: bigint): this {
        this.constraints.push({ name: 'multipleOf', args: [n] });
        this.validators.push((v: any) => v % n === 0n);
        return this;
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

    gt(d: Date): this {
        this.constraints.push({ name: 'gt', args: [d] });
        this.validators.push((v: any) => v > d);
        return this;
    }

    lt(d: Date): this {
        this.constraints.push({ name: 'lt', args: [d] });
        this.validators.push((v: any) => v < d);
        return this;
    }

    gte(d: Date): this {
        this.constraints.push({ name: 'gte', args: [d] });
        this.validators.push((v: any) => v >= d);
        return this;
    }

    lte(d: Date): this {
        this.constraints.push({ name: 'lte', args: [d] });
        this.validators.push((v: any) => v <= d);
        return this;
    }

    min(d: Date): this {
        this.constraints.push({ name: 'min', args: [d] });
        this.validators.push((v: any) => v >= d);
        return this;
    }

    max(d: Date): this {
        this.constraints.push({ name: 'max', args: [d] });
        this.validators.push((v: any) => v <= d);
        return this;
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
}

class SymbolChainBuilder extends BaseChainBuilder implements ThSymbolChain {
    declare readonly _type: symbol;
    kind = 'symbol';

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'symbol');
    }
}

class UndefinedChainBuilder extends BaseChainBuilder implements ThUndefinedChain {
    declare readonly _type: undefined;
    kind = 'undefined';

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'undefined');
    }
}

class NullChainBuilder extends BaseChainBuilder implements ThNullChain {
    declare readonly _type: null;
    kind = 'null';

    constructor() {
        super();
        this.validators.push((v: any) => v === null);
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
        for (const [key, chain] of Object.entries(this.schema)) {
            if ('validate' in chain && typeof chain.validate === 'function') {
                if (!chain.validate(value[key])) return false;
            }
        }
        return true;
    }
}

// ── createThType ─────────────────────────────────────────────────────

function createThType(): ThType {
    const t: ThType = {
        get str() { return new StringChainBuilder() as unknown as ThType['str']; },
        get string() { return new StringChainBuilder() as unknown as ThType['string']; },
        get num() { return new NumberChainBuilder() as unknown as ThType['num']; },
        get number() { return new NumberChainBuilder() as unknown as ThType['number']; },
        get bool() { return new BooleanChainBuilder() as unknown as ThType['bool']; },
        get date() { return new DateChainBuilder() as unknown as ThType['date']; },
        get sym() { return new SymbolChainBuilder() as unknown as ThType['sym']; },
        get symbol() { return new SymbolChainBuilder() as unknown as ThType['symbol']; },
        get bigInt() { return new BigIntChainBuilder() as unknown as ThType['bigInt']; },
        get bigint() { return new BigIntChainBuilder() as unknown as ThType['bigint']; },
        get undefined() { return new UndefinedChainBuilder() as unknown as ThType['undefined']; },
        get null() { return new NullChainBuilder() as unknown as ThType['null']; },
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
