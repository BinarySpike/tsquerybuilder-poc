import { describe, it, expect } from 'vitest';
import { query } from '../src/query';
import { Invoice } from './testData.ts';

type InvoiceType = typeof Invoice.infer;

describe('query builder', () => {
  it('builds complex where/andWhere/orWhere conditions', () => {
    const results = query<InvoiceType>()
      .where("invoiceNumber").contains("5").or.contains("7")
      .andWhere(i => i.where("customer.companyName").is("Luna").or.is("Moon")
        .andWhere("customer.id").in([1, 2, 3]));

    const expectedCondition = [
      [["invoiceNumber", "contains", "5"], "or", ["invoiceNumber", "contains", "7"]],
      "and",
      [
        [["customer.companyName", "is", "Luna"], "or", ["customer.companyName", "is", "Moon"]],
        "and",
        [["customer.id", "in", [1, 2, 3]]],
      ],
    ];

    expect(results.getConditions()).toEqual(expectedCondition);
  });

  it('supports field select', () => {
    const result = query<InvoiceType>()
      .where("invoiceNumber").is("1234")
      .select("invoiceNumber", "customer.address");

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber", "customer.address"]);
  });

  it('supports aggregate-only select', () => {
    const result = query<InvoiceType>()
      .where("invoiceNumber").is("1234")
      .select(s => s.countDistinct("customer.address.city"));

    expect((result as any).aggregate).toHaveProperty('type', 'countDistinct');
    expect((result as any).aggregate).toHaveProperty('path', 'customer.address.city');
  });

  it('supports combined field + aggregate select', () => {
    const result = query<InvoiceType>()
      .where("invoiceNumber").is("1234")
      .select("invoiceNumber", "customer.address", s => s.countDistinct("customer.address.city"));

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber", "customer.address"]);
    expect(result).toHaveProperty('aggregate');
    expect((result as any).aggregate).toEqual({ type: 'countDistinct', path: 'customer.address.city' });
  });

  it('supports selectAll', () => {
    const result = query<InvoiceType>()
      .where("customer.id").is(1)
      .selectAll();

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', '*');
  });

  it('supports orderBy + select', () => {
    const result = query<InvoiceType>()
      .where("invoiceNumber").is("1234")
      .orderBy("invoiceNumber", "desc")
      .orderBy("customer.address.city")
      .select("invoiceNumber");

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber"]);
    expect(result).toHaveProperty('orderBy');
    expect((result as any).orderBy).toEqual([
      { path: "invoiceNumber", direction: "desc" },
      { path: "customer.address.city", direction: "asc" },
    ]);
  });
});
