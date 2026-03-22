import { describe, it, expect } from 'vitest';
import { query } from '../src/query';
import type { Invoice } from '../src/query/dataTypes';

describe('query builder', () => {
  it('builds complex where/andWhere/orWhere conditions', () => {
    const results = query<Invoice>()
      .where("invoiceNumber").contains("5").or.contains("7")
      .andWhere(i => i.where("billingAddress.street.name").is("Luna").or.is("Moon")
        .andWhere("billingAddress.street.type.ordinalNumber").in([1, 2, 3]));

    const expectedCondition = [
      [["invoiceNumber", "contains", "5"], "or", ["invoiceNumber", "contains", "7"]],
      "and",
      [["billingAddress.street.name", "is", "Luna"], "or", ["billingAddress.street.name", "is", "Moon"]],
      "and",
      [["billingAddress.street.type.ordinalNumber", "in", [1, 2, 3]]]
    ];

    expect(results.getConditions()).toEqual(expectedCondition);
  });

  it('supports field select', () => {
    const result = query<Invoice>()
      .where("invoiceNumber").is("1234")
      .select("invoiceNumber", "billingAddress.street");

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber", "billingAddress.street"]);
  });

  it('supports aggregate-only select', () => {
    const result = query<Invoice>()
      .where("invoiceNumber").is("1234")
      .select(s => s.countDistinct("billingAddress.city"));

    expect((result as any).aggregate).toHaveProperty('type', 'countDistinct');
    expect((result as any).aggregate).toHaveProperty('path', 'billingAddress.city');
  });

  it('supports combined field + aggregate select', () => {
    const result = query<Invoice>()
      .where("invoiceNumber").is("1234")
      .select("invoiceNumber", "billingAddress.street", s => s.countDistinct("billingAddress.city"));

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber", "billingAddress.street"]);
    expect(result).toHaveProperty('aggregate');
    expect((result as any).aggregate).toEqual({ type: 'countDistinct', path: 'billingAddress.city' });
  });

  it('supports selectAll', () => {
    const result = query<Invoice>()
      .where("billingAddress.street.type.ordinalNumber").is(1)
      .selectAll();

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', '*');
  });

  it('supports orderBy + select', () => {
    const result = query<Invoice>()
      .where("invoiceNumber").is("1234")
      .orderBy("invoiceNumber", "desc")
      .orderBy("billingAddress.city")
      .select("invoiceNumber");

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber"]);
    expect(result).toHaveProperty('orderBy');
    expect((result as any).orderBy).toEqual([
      { path: "invoiceNumber", direction: "desc" },
      { path: "billingAddress.city", direction: "asc" },
    ]);
  });
});
