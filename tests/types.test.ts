import { describe, it, expect } from 'vitest';
import { th } from '../src/types';

describe('th() schema definition and validation', () => {
  const Customer = th(t => ({
    id: t.num,
    companyName: t.str,
    email: t.str.nullable.email,
    address: t.string,
  }));

  const Business = th(t => ({
    name: t.str,
    customers: t.ref(() => Customer).array,
    something: t.str,
  }));

  const LineItem = th(t => ({
    description: t.str,
    quantity: t.num,
    unitPrice: t.num,
  }));

  const Invoice = th(t => ({
    id: t.num,
    customer: t.ref(() => Customer),
    items: t.ref(() => LineItem).array,
    dueDate: t.date,
    totalAmount: t.number,
  }));

  describe('Business schema', () => {
    it('validates a correct business object', () => {
      const valid = {
        name: "Test",
        customers: [],
        something: "hi",
      };
      expect(Business.validate(valid)).toBe(true);
    });

    it('rejects an invalid business object', () => {
      expect(Business.validate({ name: 123 })).toBe(false);
    });
  });

  describe('Customer schema', () => {
    it('validates a correct customer object', () => {
      const valid = {
        id: 1,
        companyName: "Test",
        email: null,
        address: "Test",
      };
      expect(Customer.validate(valid)).toBe(true);
    });

    it('validates a customer with a valid email', () => {
      const valid = {
        id: 2,
        companyName: "Acme",
        email: "test@example.com",
        address: "123 Main St",
      };
      expect(Customer.validate(valid)).toBe(true);
    });
  });

  describe('Invoice schema', () => {
    it('validates a correct invoice object', () => {
      const validCustomer = {
        id: 1,
        companyName: "Test",
        email: null,
        address: "Test",
      };
      const valid = {
        id: 1,
        customer: validCustomer,
        items: [],
        dueDate: new Date(),
        totalAmount: 100,
      };
      expect(Invoice.validate(valid)).toBe(true);
    });

    it('validates an invoice with line items', () => {
      const valid = {
        id: 2,
        customer: { id: 1, companyName: "Acme", email: null, address: "Main St" },
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
        id: 2,
        customer: { id: 1, companyName: "Acme", email: null, address: "Main St" },
        items: [{ description: 123, quantity: "five", unitPrice: 10 }],
        dueDate: new Date(),
        totalAmount: 100,
      };
      expect(Invoice.validate(invalid)).toBe(false);
    });
  });

  describe('Business with nested customers', () => {
    it('validates business with customer array', () => {
      const valid = {
        name: "Corp",
        customers: [
          { id: 1, companyName: "Alpha", email: "a@b.com", address: "Addr" },
          { id: 2, companyName: "Beta", email: null, address: "Addr2" },
        ],
        something: "ok",
      };
      expect(Business.validate(valid)).toBe(true);
    });

    it('rejects business with invalid customer in array', () => {
      const invalid = {
        name: "Corp",
        customers: [{ id: "not a number", companyName: "Alpha", email: null, address: "Addr" }],
        something: "ok",
      };
      expect(Business.validate(invalid)).toBe(false);
    });
  });
});

describe('chain constraint types', () => {
  it('validates string constraints', () => {
    const schema = th(t => ({
      name: t.str.minLen(3).maxLen(10),
    }));

    expect(schema.validate({ name: "hello" })).toBe(true);
    expect(schema.validate({ name: "hi" })).toBe(false);       // too short
    expect(schema.validate({ name: "a".repeat(11) })).toBe(false); // too long
  });

  it('validates number constraints', () => {
    const schema = th(t => ({
      age: t.num.gte(0).lte(120),
    }));

    expect(schema.validate({ age: 25 })).toBe(true);
    expect(schema.validate({ age: -1 })).toBe(false);
    expect(schema.validate({ age: 121 })).toBe(false);
  });

  it('validates nullable fields', () => {
    const schema = th(t => ({
      email: t.str.nullable.email,
    }));

    expect(schema.validate({ email: null })).toBe(true);
    expect(schema.validate({ email: "test@example.com" })).toBe(true);
    expect(schema.validate({ email: "not-an-email" })).toBe(false);
  });

  it('validates literal constraints', () => {
    const schema = th(t => ({
      status: t.literal("active", "inactive"),
    }));

    expect(schema.validate({ status: "active" })).toBe(true);
    expect(schema.validate({ status: "inactive" })).toBe(true);
    expect(schema.validate({ status: "deleted" })).toBe(false);
  });
});
