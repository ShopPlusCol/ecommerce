export type AnalyticsOrder = {
  id: string;
  status: string;
  paymentMethod: string;
  shippingCity: string | null;
  total: number;
  amountPaid: number;
  couponCode: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  createdAt: Date;
};

export type AnalyticsItem = {
  orderId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export type AnalyticsEvent = {
  eventName: string;
  createdAt: Date;
};

export type DateRange = { from: Date; to: Date };

const excludedStatuses = new Set(["draft", "cancelled", "returned", "refunded"]);

export function isRealSale(order: AnalyticsOrder) {
  return !excludedStatuses.has(order.status);
}

function group<T>(rows: T[], key: (row: T) => string, value: (row: T) => number) {
  const values = new Map<string, number>();
  for (const row of rows) {
    const label = key(row) || "Sin información";
    values.set(label, (values.get(label) ?? 0) + value(row));
  }
  return [...values.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total);
}

function inRange(date: Date, range: DateRange) {
  return date >= range.from && date <= range.to;
}

export function previousRange(range: DateRange): DateRange {
  const duration = range.to.getTime() - range.from.getTime() + 1;
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.to.getTime() - duration),
  };
}

export function buildAdminAnalytics(
  orders: AnalyticsOrder[],
  items: AnalyticsItem[],
  events: AnalyticsEvent[],
  range: DateRange,
) {
  const currentOrders = orders.filter((order) => inRange(order.createdAt, range) && isRealSale(order));
  const prior = previousRange(range);
  const previousOrders = orders.filter((order) => inRange(order.createdAt, prior) && isRealSale(order));
  const orderIds = new Set(currentOrders.map((order) => order.id));
  const currentItems = items.filter((item) => orderIds.has(item.orderId));
  const income = currentOrders.reduce((sum, order) => sum + order.amountPaid, 0);
  const grossSales = currentOrders.reduce((sum, order) => sum + order.total, 0);
  const previousIncome = previousOrders.reduce((sum, order) => sum + order.amountPaid, 0);
  const currentEvents = events.filter((event) => inRange(event.createdAt, range));
  const funnelNames = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"];
  const funnel = funnelNames.map((eventName) => ({
    eventName,
    total: currentEvents.filter((event) => event.eventName === eventName).length,
  }));
  return {
    summary: {
      orders: currentOrders.length,
      grossSales,
      income,
      averageTicket: currentOrders.length ? Math.round(grossSales / currentOrders.length) : 0,
      previousOrders: previousOrders.length,
      previousIncome,
    },
    products: group(currentItems, (item) => `${item.name} · ${item.sku}`, (item) => item.quantity),
    productRevenue: group(currentItems, (item) => `${item.name} · ${item.sku}`, (item) => (item.unitPrice * item.quantity) - item.discount),
    cities: group(currentOrders, (order) => order.shippingCity ?? "Sin ciudad", () => 1),
    paymentMethods: group(currentOrders, (order) => order.paymentMethod, () => 1),
    coupons: group(currentOrders.filter((order) => order.couponCode), (order) => order.couponCode ?? "", () => 1),
    utmSources: group(currentOrders.filter((order) => order.utmSource), (order) => order.utmSource ?? "", () => 1),
    utmCampaigns: group(currentOrders.filter((order) => order.utmCampaign), (order) => order.utmCampaign ?? "", () => 1),
    funnel,
    range,
    previousRange: prior,
  };
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}
