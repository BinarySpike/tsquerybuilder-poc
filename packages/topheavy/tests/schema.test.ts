import { describe, it, expect } from 'vitest';
import { schema } from '../src/schema';
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
      expect(Customer._schema.companyName.kind).toBe('string');
      expect(Customer._schema.companyName.isNullable).toBe(true);
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
      expect(Address._schema.zipCode.kind).toBe('string');
      expect(Address._schema.zipCode.isNullable).toBe(false);
      expect(Address._schema.zipCode.constraints.find((c: any) => c.name === 'len')?.args[0]).toBe(5);
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
