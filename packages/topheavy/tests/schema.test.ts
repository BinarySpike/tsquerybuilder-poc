import { describe, it, expect } from 'vitest';
import { schema } from '../src/schema';
import type { ThStringChain } from '../src/schema/schema.types';
import { Customer, Business, Invoice, Address, LineItem } from './testData.ts';

describe('schema() schema definition and validation', () => {
  describe('Business schema', () => {
    it('validates a correct business object', () => {
      const valid = {
        name: "Test",
        customers: [],
      };
      expect(Business.validate(valid)).toBe(true);
    });

    it('rejects an invalid business object', () => {
      expect(Business.validate({ name: 123 } as any)).toBe(false);
    });
  });

  describe('Customer schema', () => {
    it('validates a correct customer object', () => {
      const valid = {
        id: 1,
        companyName: "Test",
        email: null,
        address: { number: "123", street: "Main", city: "Vancouver", zipCode: "12345" },
      };
      expect(Customer.validate(valid)).toBe(true);
    });

    it('validates a customer with a valid email', () => {
      const valid = {
        id: 2,
        companyName: "Acme",
        email: "test@example.com",
        address: { number: "456", street: "High", city: "London", zipCode: "90210" },
      };

      expect(Customer.validate(valid)).toBe(true);
    });

    it('has a companyName field of type nullable string', () => {
      expect(Customer.schema.companyName.kind).toBe('string');
      expect(Customer.schema.companyName.isNullable).toBe(true);
    });
  });

  describe('Invoice schema', () => {
    it('validates a correct invoice object', () => {
      const validCustomer = {
        id: 1,
        companyName: "Test",
        email: null,
        address: { number: "123", street: "Main", city: "City", zipCode: "12345" },
      };
      const valid = {
        invoiceNumber: "INV-001",
        customer: validCustomer,
        items: [],
        dueDate: new Date(),
        totalAmount: 100,
      };
      expect(Invoice.validate(valid)).toBe(true);
    });

    it('validates an invoice with line items', () => {
      const valid = {
        invoiceNumber: "INV-002",
        customer: { id: 1, companyName: "Acme", email: null, address: { number: "123", street: "Main", city: "City", zipCode: "12345" } },
        items: [
          { description: "Widget", quantity: 5, unitPrice: 10 },
          { description: "Gadget", quantity: 2, unitPrice: 25 },
        ],
        dueDate: new Date(),
        totalAmount: 100,
      };
      expect(Invoice.validate(valid)).toBe(true);
    });

    it('rejects an invoice with invalid line items', () => {
      const invalid = {
        invoiceNumber: "INV-002",
        customer: { id: 1, companyName: "Acme", email: null, address: { number: "123", street: "Main", city: "City", zipCode: "12345" } },
        items: [{ description: 123, quantity: "five", unitPrice: 10 }],
        dueDate: new Date(),
        totalAmount: 100,
      } as any;
      expect(Invoice.validate(invalid)).toBe(false);
    });
  });

  describe('Business with nested customers', () => {
    it('validates business with customer array', () => {
      const valid = {
        name: "Corp",
        customers: [
          { id: 1, companyName: "Alpha", email: "a@b.com", address: { number: "1", street: "A", city: "B", zipCode: "12345" } },
          { id: 2, companyName: "Beta", email: null, address: { number: "2", street: "C", city: "D", zipCode: "54321" } },
        ],
      };
      expect(Business.validate(valid)).toBe(true);
    });

    it('rejects business with invalid customer in array', () => {
      const invalid = {
        name: "Corp",
        customers: [{ id: "not a number", companyName: "Alpha", email: null, address: { number: "1", street: "A", city: "B", zipCode: "12345" } }],
      } as any;
      expect(Business.validate(invalid)).toBe(false);
    });
  });
  describe('Address schema', () => {
    it('has a zipcode field of type string with length 5', () => {
      expect(Address.schema.zipCode.kind).toBe('string');
      expect(Address.schema.zipCode.isNullable).toBe(false);
      expect(Address.schema.zipCode.constraints.find((c: any) => c.name === 'len')?.args[0]).toBe(5);
    });
  });
});


describe('chain constraint types', () => {
  it('validates string constraints', () => {
    const scheme = schema(t => ({
      name: t.str.minLen(3).maxLen(10),
    }));

    expect(scheme.validate({ name: "hello" })).toBe(true);
    expect(scheme.validate({ name: "hi" })).toBe(false);       // too short
    expect(scheme.validate({ name: "a".repeat(11) })).toBe(false); // too long
  });

  it('validates number constraints', () => {
    const scheme = schema(t => ({
      age: t.num.gte(0).lte(120),
    }));

    expect(scheme.validate({ age: 25 })).toBe(true);
    expect(scheme.validate({ age: -1 })).toBe(false);
    expect(scheme.validate({ age: 121 })).toBe(false);
  });

  it('validates multipleOf with integers only', () => {
    const scheme = schema(t => ({
      count: t.num.multipleOf(3),
    }));

    expect(scheme.validate({ count: 9 })).toBe(true);
    expect(scheme.validate({ count: 0 })).toBe(true);
    expect(scheme.validate({ count: 7 })).toBe(false);
    expect(scheme.validate({ count: 3.5 })).toBe(false);
  });

  it('throws on non-integer multipleOf argument', () => {
    expect(() => schema(t => ({ n: t.num.multipleOf(0.1) }))).toThrow(TypeError);
  });

  it('validates nullable fields', () => {
    const scheme = schema(t => ({
      email: t.str.nullable.email,
    }));

    expect(scheme.validate({ email: null })).toBe(true);
    expect(scheme.validate({ email: "test@example.com" })).toBe(true);
    expect(scheme.validate({ email: "not-an-email" })).toBe(false);
  });

  it('validates literal constraints', () => {
    const scheme = schema(t => ({
      status: t.literal("active", "inactive"),
    }));

    expect(scheme.validate({ status: "active" })).toBe(true);
    expect(scheme.validate({ status: "inactive" })).toBe(true);
    expect(scheme.validate({ status: "deleted" } as any)).toBe(false);
  });
});

describe('ref type', () => {
  describe('basic ref validation', () => {
    it('validates a correct ref field', () => {
      const scheme = schema(t => ({
        address: t.ref(() => Address),
      }));
      expect(scheme.validate({ address: { number: '1', street: 'A', city: 'B', zipCode: '12345' } })).toBe(true);
    });

    it('rejects a ref field with wrong inner type', () => {
      const scheme = schema(t => ({
        address: t.ref(() => Address),
      }));
      expect(scheme.validate({ address: { number: 1, street: 'A', city: 'B', zipCode: '12345' } } as any)).toBe(false);
    });

    it('rejects a ref field that is a primitive', () => {
      const scheme = schema(t => ({
        address: t.ref(() => Address),
      }));
      expect(scheme.validate({ address: 'not an object' } as any)).toBe(false);
      expect(scheme.validate({ address: 42 } as any)).toBe(false);
      expect(scheme.validate({ address: null } as any)).toBe(false);
    });

    it('rejects a missing (required) ref field', () => {
      const scheme = schema(t => ({
        name: t.str,
        address: t.ref(() => Address),
      }));
      expect(scheme.validate({ name: 'Alice' })).toBe(false);
    });

    it('rejects extra keys inside a ref schema', () => {
      const scheme = schema(t => ({
        address: t.ref(() => Address),
      }));
      expect(scheme.validate({ address: { number: '1', street: 'A', city: 'B', zipCode: '12345', extra: true } } as any)).toBe(false);
    });

    it('rejects missing keys inside a ref schema', () => {
      const scheme = schema(t => ({
        address: t.ref(() => Address),
      }));
      expect(scheme.validate({ address: { number: '1', street: 'A', city: 'B' } } as any)).toBe(false);
    });
  });

  describe('ref array', () => {
    it('validates an empty array', () => {
      const scheme = schema(t => ({ items: t.ref(() => LineItem).array }));
      expect(scheme.validate({ items: [] })).toBe(true);
    });

    it('validates an array with valid items', () => {
      const scheme = schema(t => ({ items: t.ref(() => LineItem).array }));
      expect(scheme.validate({ items: [
        { description: 'Widget', quantity: 2, unitPrice: 5 },
        { description: 'Gadget', quantity: 1, unitPrice: 20 },
      ] })).toBe(true);
    });

    it('rejects an array containing an invalid item', () => {
      const scheme = schema(t => ({ items: t.ref(() => LineItem).array }));
      expect(scheme.validate({ items: [
        { description: 'Widget', quantity: 'two', unitPrice: 5 },
      ] } as any)).toBe(false);
    });

    it('rejects a non-array value for an array ref', () => {
      const scheme = schema(t => ({ items: t.ref(() => LineItem).array }));
      expect(scheme.validate({ items: { description: 'Widget', quantity: 1, unitPrice: 5 } } as any)).toBe(false);
    });

    it('rejects extra keys in array ref items', () => {
      const scheme = schema(t => ({ items: t.ref(() => LineItem).array }));
      expect(scheme.validate({ items: [
        { description: 'Widget', quantity: 1, unitPrice: 5, extra: true },
      ] } as any)).toBe(false);
    });
  });

  describe('nested refs (ref within ref)', () => {
    it('validates deeply nested refs', () => {
      expect(Customer.validate({
        id: 1,
        companyName: 'Acme',
        email: null,
        address: { number: '1', street: 'Main', city: 'Springfield', zipCode: '12345' },
      })).toBe(true);
    });

    it('rejects an invalid deeply nested ref field', () => {
      expect(Customer.validate({
        id: 1,
        companyName: 'Acme',
        email: null,
        address: { number: '1', street: 'Main', city: 'Springfield', zipCode: '123' }, // zipCode too short
      } as any)).toBe(false);
    });

    it('rejects null for a non-nullable nested ref', () => {
      expect(Customer.validate({
        id: 1,
        companyName: 'Acme',
        email: null,
        address: null,
      } as any)).toBe(false);
    });
  });

  describe('ref.schema introspection', () => {
    it('exposes the inner schema via .schema', () => {
      const scheme = schema(t => ({
        address: t.ref(() => Address),
      }));
      expect(scheme.schema.address.schema).toBe(Address.schema);
    });
  });
});

describe('primitive arrays', () => {
  it('validates an array of strings', () => {
    const scheme = schema(t => ({ tags: t.str.array }));
    expect(scheme.validate({ tags: ['a', 'b', 'c'] })).toBe(true);
    expect(scheme.validate({ tags: [] })).toBe(true);
  });

  it('rejects a non-array value', () => {
    const scheme = schema(t => ({ tags: t.str.array }));
    expect(scheme.validate({ tags: 'not-an-array' } as any)).toBe(false);
  });

  it('rejects an array with wrong element type', () => {
    const scheme = schema(t => ({ tags: t.str.array }));
    expect(scheme.validate({ tags: [1, 2, 3] } as any)).toBe(false);
  });

  it('applies element constraints — t.str.array.minLen(3)', () => {
    const scheme = schema(t => ({ tags: t.str.array.minLen(3) }));
    expect(scheme.validate({ tags: ['abc', 'defg'] })).toBe(true);
    expect(scheme.validate({ tags: ['ab'] } as any)).toBe(false);
  });

  it('applies element constraints — t.num.array.gt(0)', () => {
    const scheme = schema(t => ({ scores: t.num.array.gt(0) }));
    expect(scheme.validate({ scores: [1, 2, 3] })).toBe(true);
    expect(scheme.validate({ scores: [1, 0, 3] } as any)).toBe(false);
  });

  it('applies element constraints — t.str.array.len(5)', () => {
    const scheme = schema(t => ({ codes: t.str.array.len(5) }));
    expect(scheme.validate({ codes: ['ABCDE', '12345'] })).toBe(true);
    expect(scheme.validate({ codes: ['ABCD'] } as any)).toBe(false);
    expect(scheme.validate({ codes: ['ABCDEF'] } as any)).toBe(false);
  });

  it('supports nullable element chains — t.str.nullable.array', () => {
    const scheme = schema(t => ({ tags: t.str.nullable.array }));
    expect(scheme.validate({ tags: ['a', null, 'b'] })).toBe(true);
    expect(scheme.validate({ tags: [1] } as any)).toBe(false);
  });

  it('supports nullable array — t.str.array.nullable', () => {
    const scheme = schema(t => ({ tags: t.str.array.nullable }));
    expect(scheme.validate({ tags: null })).toBe(true);
    expect(scheme.validate({ tags: ['a', 'b'] })).toBe(true);
    expect(scheme.validate({})).toBe(true);
  });

  it('validates array of numbers with multiple constraints', () => {
    const scheme = schema(t => ({ values: t.num.array.gte(0).lte(100) }));
    expect(scheme.validate({ values: [0, 50, 100] })).toBe(true);
    expect(scheme.validate({ values: [-1, 50] } as any)).toBe(false);
    expect(scheme.validate({ values: [50, 101] } as any)).toBe(false);
  });
});

describe('inline nested objects', () => {
  it('validates a correct nested object', () => {
    const scheme = schema(t => ({
      name: t.str,
      address: {
        street: t.str,
        city: t.str,
      },
    }));
    expect(scheme.validate({ name: 'Alice', address: { street: 'Main', city: 'Springfield' } })).toBe(true);
  });

  it('rejects a missing required nested object', () => {
    const scheme = schema(t => ({
      name: t.str,
      address: {
        street: t.str,
        city: t.str,
      },
    }));
    expect(scheme.validate({ name: 'Alice' })).toBe(false);
  });

  it('rejects a wrong type inside a nested object', () => {
    const scheme = schema(t => ({
      address: {
        street: t.str,
        number: t.num,
      },
    }));
    expect(scheme.validate({ address: { street: 'Main', number: 'not a number' } } as any)).toBe(false);
  });

  it('rejects extra keys inside a nested object', () => {
    const scheme = schema(t => ({
      address: {
        street: t.str,
      },
    }));
    expect(scheme.validate({ address: { street: 'Main', extra: true } } as any)).toBe(false);
  });

  it('rejects missing keys inside a nested object', () => {
    const scheme = schema(t => ({
      address: {
        street: t.str,
        city: t.str,
      },
    }));
    expect(scheme.validate({ address: { street: 'Main' } } as any)).toBe(false);
  });

  it('validates deeply nested objects', () => {
    const scheme = schema(t => ({
      org: {
        location: {
          city: t.str,
          zip: t.str.len(5),
        },
      },
    }));
    expect(scheme.validate({ org: { location: { city: 'Springfield', zip: '12345' } } })).toBe(true);
    expect(scheme.validate({ org: { location: { city: 'Springfield', zip: '123' } } } as any)).toBe(false);
  });

  it('validates a nested object field with constraints', () => {
    const scheme = schema(t => ({
      user: {
        name: t.str.minLen(3),
        age: t.num.gte(0),
      },
    }));
    expect(scheme.validate({ user: { name: 'Alice', age: 30 } })).toBe(true);
    expect(scheme.validate({ user: { name: 'Al', age: 30 } } as any)).toBe(false);
    expect(scheme.validate({ user: { name: 'Alice', age: -1 } } as any)).toBe(false);
  });
});

describe('nullable ref fields', () => {
  it('allows a nullable ref field to be absent', () => {
    const scheme = schema(t => ({
      name: t.str,
      address: t.ref(() => Address).nullable,
    }));

    expect(scheme.validate({ name: 'Alice' })).toBe(true);
  });

  it('allows a nullable ref field to be null', () => {
    const scheme = schema(t => ({
      name: t.str,
      address: t.ref(() => Address).nullable,
    }));

    expect(scheme.validate({ name: 'Alice', address: null })).toBe(true);
  });

  it('still validates the ref when present', () => {
    const scheme = schema(t => ({
      name: t.str,
      address: t.ref(() => Address).nullable,
    }));

    expect(scheme.validate({ name: 'Alice', address: { number: '1', street: 'A', city: 'B', zipCode: '12345' } })).toBe(true);
    expect(scheme.validate({ name: 'Alice', address: { number: 1, street: 'A', city: 'B', zipCode: '12345' } } as any)).toBe(false);
  });

  it('requires a non-nullable ref field', () => {
    const scheme = schema(t => ({
      name: t.str,
      address: t.ref(() => Address),
    }));

    expect(scheme.validate({ name: 'Alice' })).toBe(false);
  });
});

describe('strict object validation', () => {
  it('rejects objects with extra keys', () => {
    const scheme = schema(t => ({
      name: t.str,
    }));

    expect(scheme.validate({ name: "hello", age: 25 })).toBe(false);
    expect(scheme.validate({ name: "hello", foo: "bar", baz: 1 })).toBe(false);
  });

  it('accepts objects with exactly the schema keys', () => {
    const scheme = schema(t => ({
      name: t.str,
      age: t.num,
    }));

    expect(scheme.validate({ name: "hello", age: 25 })).toBe(true);
  });

  it('rejects objects with missing non-nullable keys', () => {
    const scheme = schema(t => ({
      name: t.str,
      age: t.num,
    }));

    expect(scheme.validate({ name: "hello" })).toBe(false);
    expect(scheme.validate({ age: 25 })).toBe(false);
    expect(scheme.validate({})).toBe(false);
  });

  it('accepts objects with missing nullable keys', () => {
    const scheme = schema(t => ({
      name: t.str,
      nickname: t.str.nullable,
    }));

    expect(scheme.validate({ name: "hello" })).toBe(true);
    expect(scheme.validate({ name: "hello", nickname: null })).toBe(true);
    expect(scheme.validate({ name: "hello", nickname: "hey" })).toBe(true);
  });

  it('rejects missing keys in nested objects', () => {
    expect(Address.validate({ number: "1", street: "A", city: "B" })).toBe(false);
  });

  it('rejects extra keys in nested objects', () => {
    expect(Address.validate({ number: "1", street: "A", city: "B", zipCode: "12345", extra: true })).toBe(false);
  });

  it('rejects extra keys in array items', () => {
    const scheme = schema(t => ({
      name: t.str,
      customers: t.ref(() => Customer).array,
    }));

    const invalid = {
      name: "Corp",
      customers: [
        { id: 1, companyName: "A", email: null, address: { number: "1", street: "A", city: "B", zipCode: "12345" }, extra: "field" },
      ],
    };
    expect(scheme.validate(invalid)).toBe(false);
  });
});

describe('template constraint', () => {
  it('matches a fixed string with no interpolations', () => {
    const scheme = schema(t => ({ code: t.str.template`FIXED` }));
    expect(scheme.validate({ code: 'FIXED' })).toBe(true);
    expect(scheme.validate({ code: 'OTHER' })).toBe(false);
    expect(scheme.validate({ code: 'PREFIX-FIXED' })).toBe(false);
  });

  it('anchors both ends — no leading or trailing content allowed', () => {
    const scheme = schema(t => ({ code: t.str.template`AB` }));
    expect(scheme.validate({ code: 'AB' })).toBe(true);
    expect(scheme.validate({ code: 'xAB' })).toBe(false);
    expect(scheme.validate({ code: 'ABx' })).toBe(false);
    expect(scheme.validate({ code: 'xABx' })).toBe(false);
  });

  it('allows any content in interpolated slots', () => {
    const scheme = schema(t => ({ ref: t.str.template`INV-${t.str}-END` }));
    expect(scheme.validate({ ref: 'INV--END' })).toBe(true);       // empty slot
    expect(scheme.validate({ ref: 'INV-001-END' })).toBe(true);
    expect(scheme.validate({ ref: 'INV-abc123-END' })).toBe(true);
    expect(scheme.validate({ ref: 'INV-001' })).toBe(false);        // missing suffix
    expect(scheme.validate({ ref: '001-END' })).toBe(false);        // missing prefix
  });

  it('handles multiple interpolated slots independently', () => {
    const scheme = schema(t => ({ path: t.str.template`/${t.str}/${t.str}` }));
    expect(scheme.validate({ path: '/a/b' })).toBe(true);
    expect(scheme.validate({ path: '/foo/bar' })).toBe(true);
    expect(scheme.validate({ path: '/a/' })).toBe(true);            // empty second slot
    expect(scheme.validate({ path: '/a' })).toBe(false);            // missing second segment
    expect(scheme.validate({ path: 'a/b' })).toBe(false);           // missing leading slash
  });

  it('escapes regex special characters in literal parts', () => {
    const scheme = schema(t => ({ ver: t.str.template`v1.0.${t.str}` }));
    expect(scheme.validate({ ver: 'v1.0.42' })).toBe(true);
    expect(scheme.validate({ ver: 'v1X0Y42' })).toBe(false);        // dots must be literal
  });

  it('chains additional constraints after template', () => {
    const scheme = schema(t => ({
      code: t.str.template`INV-${t.str}`.minLen(6),
    }));
    expect(scheme.validate({ code: 'INV-1' })).toBe(false);         // too short (len 5)
    expect(scheme.validate({ code: 'INV-12' })).toBe(true);
    expect(scheme.validate({ code: 'OTHER' })).toBe(false);         // wrong pattern
  });

  it('records a template constraint entry', () => {
    const chain = schema(t => ({ x: t.str.template`A-${t.str}-B` }));
    const constraints = (chain.schema.x as ThStringChain).constraints;
    expect(constraints.some(c => c.name === 'template')).toBe(true);
  });

  it('is immutable — base chain is not affected', () => {
    const base = schema(t => ({ x: t.str }));
    const withTemplate = schema(t => ({ x: t.str.template`PREFIX-${t.str}` }));
    expect(base.validate({ x: 'anything' })).toBe(true);
    expect(withTemplate.validate({ x: 'anything' })).toBe(false);
    expect(withTemplate.validate({ x: 'PREFIX-anything' })).toBe(true);
  });

  describe('len() slot — exact length', () => {
    const scheme = schema(t => ({ code: t.str.template`INV-${t.str.len(4)}` }));

    it('accepts a slot value of exactly the required length', () => {
      expect(scheme.validate({ code: 'INV-0001' })).toBe(true);
      expect(scheme.validate({ code: 'INV-ABCD' })).toBe(true);
    });

    it('rejects a slot value that is too short', () => {
      expect(scheme.validate({ code: 'INV-001' })).toBe(false);
    });

    it('rejects a slot value that is too long', () => {
      expect(scheme.validate({ code: 'INV-00001' })).toBe(false);
    });
  });

  describe('minLen() slot — minimum length', () => {
    const scheme = schema(t => ({ tag: t.str.template`#${t.str.minLen(3)}` }));

    it('accepts a slot value at the minimum', () => {
      expect(scheme.validate({ tag: '#abc' })).toBe(true);
    });

    it('accepts a slot value longer than the minimum', () => {
      expect(scheme.validate({ tag: '#abcdef' })).toBe(true);
    });

    it('rejects a slot value below the minimum', () => {
      expect(scheme.validate({ tag: '#ab' })).toBe(false);
      expect(scheme.validate({ tag: '#' })).toBe(false);
    });
  });

  describe('maxLen() slot — maximum length', () => {
    const scheme = schema(t => ({ code: t.str.template`ID-${t.str.maxLen(4)}` }));

    it('accepts a slot value at the maximum', () => {
      expect(scheme.validate({ code: 'ID-1234' })).toBe(true);
    });

    it('accepts an empty slot value', () => {
      expect(scheme.validate({ code: 'ID-' })).toBe(true);
    });

    it('rejects a slot value exceeding the maximum', () => {
      expect(scheme.validate({ code: 'ID-12345' })).toBe(false);
    });
  });

  describe('uppercase() slot', () => {
    const scheme = schema(t => ({ code: t.str.template`${t.str.uppercase()}-${t.str.uppercase()}` }));

    it('accepts fully uppercase segments', () => {
      expect(scheme.validate({ code: 'FOO-BAR' })).toBe(true);
      expect(scheme.validate({ code: 'A-Z' })).toBe(true);
    });

    it('rejects lowercase letters in either segment', () => {
      expect(scheme.validate({ code: 'foo-BAR' })).toBe(false);
      expect(scheme.validate({ code: 'FOO-bar' })).toBe(false);
    });
  });

  describe('lowercase() slot', () => {
    const scheme = schema(t => ({ slug: t.str.template`${t.str.lowercase()}-${t.str.lowercase()}` }));

    it('accepts fully lowercase segments', () => {
      expect(scheme.validate({ slug: 'foo-bar' })).toBe(true);
    });

    it('rejects uppercase letters in either segment', () => {
      expect(scheme.validate({ slug: 'Foo-bar' })).toBe(false);
      expect(scheme.validate({ slug: 'foo-Bar' })).toBe(false);
    });
  });

  describe('beginsWith() slot', () => {
    const scheme = schema(t => ({ ref: t.str.template`[${t.str.beginsWith('REF')}]` }));

    it('accepts a slot value that starts with the required prefix', () => {
      expect(scheme.validate({ ref: '[REF001]' })).toBe(true);
      expect(scheme.validate({ ref: '[REF]' })).toBe(true);
    });

    it('rejects a slot value without the required prefix', () => {
      expect(scheme.validate({ ref: '[001]' })).toBe(false);
      expect(scheme.validate({ ref: '[ref001]' })).toBe(false);
    });
  });

  describe('endsWith() slot', () => {
    const scheme = schema(t => ({ file: t.str.template`${t.str.endsWith('.json')}` }));

    it('accepts a slot value ending with the required suffix', () => {
      expect(scheme.validate({ file: 'config.json' })).toBe(true);
      expect(scheme.validate({ file: '.json' })).toBe(true);
    });

    it('rejects a slot value without the required suffix', () => {
      expect(scheme.validate({ file: 'config.yaml' })).toBe(false);
      expect(scheme.validate({ file: 'config.json.bak' })).toBe(false);
    });
  });

  describe('contains() slot', () => {
    const scheme = schema(t => ({ label: t.str.template`${t.str.contains('WARN')}` }));

    it('accepts a slot value containing the required substring', () => {
      expect(scheme.validate({ label: 'WARN' })).toBe(true);
      expect(scheme.validate({ label: 'prefix-WARN-suffix' })).toBe(true);
    });

    it('rejects a slot value missing the required substring', () => {
      expect(scheme.validate({ label: 'INFO' })).toBe(false);
      expect(scheme.validate({ label: 'warn' })).toBe(false);
    });
  });

  describe('regex() slot', () => {
    const scheme = schema(t => ({ id: t.str.template`ID-${t.str.regex(/\d{3}/)}` }));

    it('accepts a slot value matching the regex', () => {
      expect(scheme.validate({ id: 'ID-123' })).toBe(true);
      expect(scheme.validate({ id: 'ID-000' })).toBe(true);
    });

    it('rejects a slot value not matching the regex', () => {
      expect(scheme.validate({ id: 'ID-12' })).toBe(false);
      expect(scheme.validate({ id: 'ID-abc' })).toBe(false);
    });
  });

  describe('email slot', () => {
    const scheme = schema(t => ({ contact: t.str.template`mailto:${t.str.email}` }));

    it('accepts a valid mailto URI', () => {
      expect(scheme.validate({ contact: 'mailto:user@example.com' })).toBe(true);
    });

    it('rejects an invalid email in the slot', () => {
      expect(scheme.validate({ contact: 'mailto:not-an-email' })).toBe(false);
    });

    it('rejects a value missing the mailto: prefix', () => {
      expect(scheme.validate({ contact: 'user@example.com' })).toBe(false);
    });
  });

  describe('multiple constraints on one slot (lookahead composition)', () => {
    const scheme = schema(t => ({
      code: t.str.template`${t.str.minLen(3).uppercase()}`,
    }));

    it('accepts a value satisfying both minLen and uppercase', () => {
      expect(scheme.validate({ code: 'ABC' })).toBe(true);
      expect(scheme.validate({ code: 'ABCDEF' })).toBe(true);
    });

    it('rejects a value that is too short even if uppercase', () => {
      expect(scheme.validate({ code: 'AB' })).toBe(false);
    });

    it('rejects a value that is long enough but not uppercase', () => {
      expect(scheme.validate({ code: 'abc' })).toBe(false);
      expect(scheme.validate({ code: 'Abc' })).toBe(false);
    });
  });

  describe('raw string literal as interpolation', () => {
    it('uses the raw value as a fixed string segment', () => {
      const prefix = 'ACME';
      const scheme = schema(t => ({ code: t.str.template`${prefix}-${t.str}` }));
      expect(scheme.validate({ code: 'ACME-001' })).toBe(true);
      expect(scheme.validate({ code: 'OTHER-001' })).toBe(false);
    });

    it('escapes regex special characters in the raw string', () => {
      const scheme = schema(t => ({ ver: t.str.template`${'v1.0'}-${t.str}` }));
      expect(scheme.validate({ ver: 'v1.0-rc1' })).toBe(true);
      expect(scheme.validate({ ver: 'v1X0-rc1' })).toBe(false);
    });
  });

  describe('raw number literal as interpolation', () => {
    it('uses the number as a fixed segment', () => {
      const scheme = schema(t => ({ code: t.str.template`v${42}-${t.str}` }));
      expect(scheme.validate({ code: 'v42-beta' })).toBe(true);
      expect(scheme.validate({ code: 'v43-beta' })).toBe(false);
    });
  });

  describe('complex real-world pattern', () => {
    // Invoice format: INV-<4 uppercase chars>-<3 digits>
    const scheme = schema(t => ({
      invoiceRef: t.str.template`INV-${t.str.len(4).uppercase()}-${t.str.regex(/\d{3}/)}`,
    }));

    it('accepts a well-formed invoice reference', () => {
      expect(scheme.validate({ invoiceRef: 'INV-ACME-001' })).toBe(true);
    });

    it('rejects wrong segment lengths', () => {
      expect(scheme.validate({ invoiceRef: 'INV-ACM-001' })).toBe(false);   // 3 not 4
      expect(scheme.validate({ invoiceRef: 'INV-ACMEX-001' })).toBe(false); // 5 not 4
    });

    it('rejects non-uppercase first segment', () => {
      expect(scheme.validate({ invoiceRef: 'INV-acme-001' })).toBe(false);
    });

    it('rejects non-digit second segment', () => {
      expect(scheme.validate({ invoiceRef: 'INV-ACME-abc' })).toBe(false);
    });

    it('rejects missing separators', () => {
      expect(scheme.validate({ invoiceRef: 'INVACME001' })).toBe(false);
    });
  });
});
