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

//const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;

// ── BaseChainBuilder ─────────────────────────────────────────────────

class BaseChainBuilder {
    protected validators: ValidatorFn[] = [];
    readonly constraints: ThConstraint[] = [];
    readonly isNullable: boolean = false;
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
        (clone as any).isNullable = true;
        return clone;
    }

    test(fn: ValidatorFn): this {
        const clone = this._clone();
        clone.validators.push(fn);
        return clone;
    }

    get array(): any {
        return new PrimitiveArrayChainBuilder(this);
    }
}

// ── PrimitiveArrayChainBuilder ────────────────────────────────────────

class PrimitiveArrayChainBuilder {
    private _elementChain: BaseChainBuilder;
    readonly isNullable: boolean;
    private _arrayValidators: ValidatorFn[] = [];

    constructor(elementChain: BaseChainBuilder, isNullable = false, arrayValidators: ValidatorFn[] = []) {
        this._elementChain = elementChain;
        this.isNullable = isNullable;
        this._arrayValidators = arrayValidators;

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (typeof prop === 'symbol' || prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                const elementVal = (target._elementChain as any)[prop];
                if (typeof elementVal === 'function') {
                    return (...args: any[]) => {
                        const result = elementVal.apply(target._elementChain, args);
                        if (result instanceof BaseChainBuilder) {
                            return new PrimitiveArrayChainBuilder(result, target.isNullable, target._arrayValidators);
                        }
                        return result;
                    };
                }
                if (elementVal instanceof BaseChainBuilder) {
                    return new PrimitiveArrayChainBuilder(elementVal, target.isNullable, target._arrayValidators);
                }
                return elementVal;
            }
        });
    }

    get kind(): string { return `${this._elementChain.kind}[]`; }
    get constraints() { return this._elementChain.constraints; }

    get nullable(): this {
        return new PrimitiveArrayChainBuilder(this._elementChain, true, this._arrayValidators) as this;
    }

    test(fn: ValidatorFn): this {
        return new PrimitiveArrayChainBuilder(this._elementChain, this.isNullable, [...this._arrayValidators, fn]) as this;
    }

    validate(value: any): boolean {
        if (this.isNullable && (value === null || value === undefined)) return true;
        if (!Array.isArray(value)) return false;
        if (!this._arrayValidators.every(fn => fn(value))) return false;
        return value.every((el: any) => this._elementChain.validate(el));
    }
}

// ── toRegexFragment ───────────────────────────────────────────────────

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toRegexFragment(chain: BaseChainBuilder): string {
    // Char-class and quantifier are merged into a single consuming fragment
    // (e.g. len(4).uppercase() → [A-Z\s\d\W]{4}) so that the slot boundary
    // is respected. Other constraints are applied as lookaheads in front.
    let charClass: string | null = null;
    let quantifier: string | null = null;
    const lookaheadFragments: string[] = [];

    for (const c of chain.constraints.filter(c => c.name !== 'template')) {
        switch (c.name) {
            case 'len':        quantifier = `{${c.args[0]}}`;       break;
            case 'minLen':     quantifier = `{${c.args[0]},}`;      break;
            case 'maxLen':     quantifier = `{0,${c.args[0]}}`;     break;
            case 'uppercase':  charClass = '[A-Z\\s\\d\\W]';        break;
            case 'lowercase':  charClass = '[a-z\\s\\d\\W]';        break;
            case 'beginsWith': lookaheadFragments.push(`${escapeRegex(c.args[0])}.*`);       break;
            case 'endsWith':   lookaheadFragments.push(`.*${escapeRegex(c.args[0])}`);       break;
            case 'contains':   lookaheadFragments.push(`.*${escapeRegex(c.args[0])}.*`);    break;
            case 'regex':      lookaheadFragments.push(`(?:${(c.args[0] as RegExp).source})`); break;
            // Strip outer anchors so the email pattern embeds cleanly
            case 'email':      lookaheadFragments.push(EMAIL_REGEX.source.replace(/^\^|\$$/g, '')); break;
        }
    }

    // Build the consuming base: char class + quantifier fused into one token
    const base = charClass !== null
        ? `${charClass}${quantifier ?? '+'}`   // e.g. [A-Z\s\d\W]{4}
        : quantifier !== null
        ? `.${quantifier}`                      // e.g. .{4}
        : null;

    if (base !== null) {
        const lookaheads = lookaheadFragments.map(f => `(?=${f})`).join('');
        return `${lookaheads}${base}`;
    }

    // No quantifier/charClass — use the last fragment as the consuming pattern
    // and apply the rest as lookaheads, so positional fragments (endsWith, etc.)
    // are anchored correctly by the outer template's ^ and $.
    if (lookaheadFragments.length === 0) return '.*';
    const last = lookaheadFragments[lookaheadFragments.length - 1];
    const prefixLookaheads = lookaheadFragments.slice(0, -1).map(f => `(?=${f})`).join('');
    return `${prefixLookaheads}${last}`;
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

    template(strings: TemplateStringsArray, ...exprs: (ThStringChain<any> | string | number)[]): this {
        const clone = this._clone();
        clone.constraints.push({ name: 'template', args: [strings, ...exprs] });
        let pattern = '^';
        for (let i = 0; i < strings.length; i++) {
            pattern += escapeRegex(strings[i]);
            if (i < exprs.length) {
                const expr = exprs[i];
                pattern += expr instanceof BaseChainBuilder
                    ? toRegexFragment(expr)
                    : escapeRegex(String(expr));
            }
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
    readonly isNullable: boolean;

    constructor(resolve: () => any, isArray = false, isNullable = false) {
        this._resolve = resolve;
        this._isArray = isArray;
        this.isNullable = isNullable;
    }

    private _get(): TypeDefinitionImpl {
        if (!this._resolved) {
            this._resolved = this._resolve() as TypeDefinitionImpl;
        }
        return this._resolved;
    }

    get array(): RefTypeDefinition {
        return new RefTypeDefinition(this._resolve, true, this.isNullable);
    }

    get nullable(): RefTypeDefinition {
        return new RefTypeDefinition(this._resolve, this._isArray, true);
    }

    get infer(): any {
        return undefined; // phantom — only meaningful at the type level
    }

    get schema(): Record<string, BaseChainBuilder | TypeDefinitionImpl | RefTypeDefinition | PrimitiveArrayChainBuilder> {
        return this._get().schema;
    }

    validate(value: any): boolean {
        if (this.isNullable && (value === null || value === undefined)) return true;
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
    readonly schema: Record<string, BaseChainBuilder | TypeDefinitionImpl | RefTypeDefinition | PrimitiveArrayChainBuilder>;
    private _isArray: boolean;

    constructor(schema: Record<string, any> = {}, isArray = false) {
        const built: Record<string, BaseChainBuilder | TypeDefinitionImpl | RefTypeDefinition | PrimitiveArrayChainBuilder> = {};
        for (const [key, value] of Object.entries(schema)) {
            if (value instanceof BaseChainBuilder || value instanceof TypeDefinitionImpl || value instanceof RefTypeDefinition || value instanceof PrimitiveArrayChainBuilder) {
                built[key] = value;
            } else if (typeof value === 'object' && value !== null) {
                built[key] = new TypeDefinitionImpl(value);
            } else {
                throw new TypeError(`Schema field "${key}" is not a valid field type`);
            }
        }
        this.schema = built;
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
            if (!(key in value)) {
                // Missing key: only allowed if the field is nullable
                if ((chain instanceof BaseChainBuilder || chain instanceof RefTypeDefinition || chain instanceof PrimitiveArrayChainBuilder) && chain.isNullable) continue;
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
 *   name: t.string.minLen(3),
 *   age: t.number.gte(18)
 * }));
 * ```
 */
export function schema<S extends Record<string, ValidThField>>(
    cb: (t: ThType) => S
): TypeDefinition<
    S extends Record<string, ValidThField> ? InferSchema<S> : unknown,
    S extends Record<string, ValidThField> ? S : Record<string, any>
> {
    const t = createThType();
    const schemaObj = cb(t);
    return new TypeDefinitionImpl((schemaObj ?? {}) as any) as any;
}
