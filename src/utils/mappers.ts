/**
 * Bali Catering Service — API → Frontend mappers
 * -------------------------------------------------
 * The backend API returns SQLite columns and settings in snake_case.
 * The frontend types and components consume camelCase.
 * These mappers convert backend payloads into frontend shapes
 * (and can be extended for reverse mapping when sending updates).
 */

type Dict = Record<string, any>;

function camelize(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Deep-copy an object, converting all keys from snake_case to camelCase. */
export function mapKeys<T>(obj: Dict | undefined | null): T {
  if (!obj) return obj as T;
  if (Array.isArray(obj)) return obj.map((o) => mapKeys(o)) as unknown as T;
  if (typeof obj !== 'object') return obj as T;
  const out: Dict = {};
  for (const [k, v] of Object.entries(obj)) {
    const newKey = k.startsWith('_') ? k : camelize(k);
    if (v && typeof v === 'object') {
      out[newKey] = mapKeys(v);
    } else {
      out[newKey] = v;
    }
  }
  return out as T;
}

/** Map a list of raw backend rows to frontend entities. */
export function mapList<T>(rows: unknown[] | undefined | null): T[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => mapKeys<T>(r as Dict));
}

/**
 * Normalize a product row — convert snake_case, coerce flags to booleans,
 * and keep prices as numbers.
 */
export function mapProduct(raw: Dict): Dict {
  const p = mapKeys<Dict>(raw);
  p.isAvailable = p.isAvailable === 1 || p.isAvailable === true;
  p.isFeatured = p.isFeatured === 1 || p.isFeatured === true;
  p.isSpecialty = p.isSpecialty === 1 || p.isSpecialty === true;
  p.isSeasonal = p.isSeasonal === 1 || p.isSeasonal === true;
  if (p.price !== undefined) p.price = Number(p.price) || 0;
  if (p.costPrice !== undefined) p.costPrice = Number(p.costPrice) || 0;
  if (p.preparationTimeMinutes !== undefined) p.preparationTimeMinutes = Number(p.preparationTimeMinutes) || 0;
  return p;
}

export function mapProductList(rows: unknown[] | undefined | null): Dict[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapProduct);
}

/** Normalize a category row. */
export function mapCategory(raw: Dict): Dict {
  const c = mapKeys<Dict>(raw);
  if (c.displayOrder !== undefined) c.displayOrder = Number(c.displayOrder) || 0;
  return c;
}

/** Normalize an ingredient row. */
export function mapIngredient(raw: Dict): Dict {
  const i = mapKeys<Dict>(raw);
  if (i.currentStock !== undefined) i.currentStock = Number(i.currentStock) || 0;
  if (i.minimumStock !== undefined) i.minimumStock = Number(i.minimumStock) || 0;
  if (i.costPerUnit !== undefined) i.costPerUnit = Number(i.costPerUnit) || 0;
  return i;
}

/** Normalize a customer row. */
export function mapCustomer(raw: Dict): Dict {
  const c = mapKeys<Dict>(raw);
  if (c.totalSpent !== undefined) c.totalSpent = Number(c.totalSpent) || 0;
  if (c.totalOrders !== undefined) c.totalOrders = Number(c.totalOrders) || 0;
  return c;
}

/** Normalize an order row (and its nested items). */
export function mapOrder(raw: Dict): Dict {
  const o = mapKeys<Dict>(raw);
  if (o.subtotal !== undefined) o.subtotal = Number(o.subtotal) || 0;
  if (o.deliveryFee !== undefined) o.deliveryFee = Number(o.deliveryFee) || 0;
  if (o.discount !== undefined) o.discount = Number(o.discount) || 0;
  if (o.total !== undefined) o.total = Number(o.total) || 0;
  // Garantir que items é sempre uma array (nunca undefined/null) para evitar .map() crash
  if (!Array.isArray(o.items)) o.items = [];
  o.items = (o.items as Dict[]).map((it: Dict) => {
    const item = mapKeys<Dict>(it);
    if (item.price !== undefined) item.price = Number(item.price) || 0;
    if (item.quantity !== undefined) item.quantity = Number(item.quantity) || 0;
    if (item.unitCost !== undefined) item.unitCost = Number(item.unitCost) || 0;
    return item;
  });
  return o;
}

/** Normalize a payment row. */
export function mapPayment(raw: Dict): Dict {
  const p = mapKeys<Dict>(raw);
  if (p.amount !== undefined) p.amount = Number(p.amount) || 0;
  return p;
}

/** Normalize a cash shift row. */
export function mapCashShift(raw: Dict): Dict {
  const s = mapKeys<Dict>(raw);
  if (s.initialCashFloat !== undefined) s.initialCashFloat = Number(s.initialCashFloat) || 0;
  if (s.expectedCash !== undefined) s.expectedCash = Number(s.expectedCash) || 0;
  if (s.countedCash !== undefined) s.countedCash = Number(s.countedCash) || 0;
  if (s.cashDiscrepancy !== undefined) s.cashDiscrepancy = Number(s.cashDiscrepancy) || 0;
  if (s.totalSalesAmount !== undefined) s.totalSalesAmount = Number(s.totalSalesAmount) || 0;
  if (s.ordersCount !== undefined) s.ordersCount = Number(s.ordersCount) || 0;
  if (typeof s.paymentBreakdown === 'string') {
    try { s.paymentBreakdown = JSON.parse(s.paymentBreakdown); } catch { s.paymentBreakdown = {}; }
  }
  return s;
}

/** Normalize a debt row. */
export function mapDebt(raw: Dict): Dict {
  const d = mapKeys<Dict>(raw);
  if (d.originalAmount !== undefined) d.originalAmount = Number(d.originalAmount) || 0;
  if (d.amountPaid !== undefined) d.amountPaid = Number(d.amountPaid) || 0;
  if (d.balance !== undefined) d.balance = Number(d.balance) || 0;
  return d;
}

export default {
  mapKeys,
  mapList,
  mapProduct,
  mapProductList,
  mapCategory,
  mapIngredient,
  mapCustomer,
  mapOrder,
  mapPayment,
  mapCashShift,
  mapDebt,
};