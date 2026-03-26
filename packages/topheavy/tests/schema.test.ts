import { describe, it, expect } from 'vitest';
import { schema } from '../src/schema';
import type { ThStringChain } from '../src/schema/schema.types';
import { Customer, Business, Invoice, Address } from './testData.ts';

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
});
