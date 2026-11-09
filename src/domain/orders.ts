import type { Cents } from './money';

/** How the order reached the business. */
export type OrderChannel = 'call' | 'whatsapp' | 'walk-in';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  priceCents: Cents;
  prepMinutes: number;
  soldOut?: boolean;
}

/** Quantity per menu item id. Items with quantity 0 are removed. */
export type OrderLines = Readonly<Record<string, number>>;

export type FieldRule = 'required' | 'optional';

export interface ContactRules {
  name: FieldRule;
  phone: FieldRule;
}

/**
 * What we need to know about the customer for each channel:
 * - call: a name to shout out when they arrive; number is handy for call-backs
 * - whatsapp: the number is how we reply, so it is required
 * - walk-in: they are standing there, so the queue number is enough
 */
export const CONTACT_RULES: Record<OrderChannel, ContactRules> = {
  call: { name: 'required', phone: 'optional' },
  whatsapp: { name: 'optional', phone: 'required' },
  'walk-in': { name: 'optional', phone: 'optional' },
};

export function setLineQuantity(lines: OrderLines, itemId: string, quantity: number): OrderLines {
  const next = { ...lines };
  if (quantity > 0) next[itemId] = quantity;
  else delete next[itemId];
  return next;
}

export function selectedItems(menu: readonly MenuItem[], lines: OrderLines) {
  return menu
    .filter((item) => (lines[item.id] ?? 0) > 0)
    .map((item) => ({ item, quantity: lines[item.id]! }));
}

export function orderItemCount(lines: OrderLines): number {
  return Object.values(lines).reduce((sum, qty) => sum + qty, 0);
}

export function orderTotalCents(menu: readonly MenuItem[], lines: OrderLines): Cents {
  return selectedItems(menu, lines).reduce(
    (sum, { item, quantity }) => sum + item.priceCents * quantity,
    0,
  );
}

/**
 * How long one order takes to make on its own. Items in an order are cooked
 * side by side, so it's the slowest item's average prep time. 0 means nothing
 * needs cooking (e.g. only drinks).
 */
export function orderPrepMinutes(menu: readonly MenuItem[], lines: OrderLines): number {
  const selected = selectedItems(menu, lines);
  return selected.length === 0 ? 0 : Math.max(...selected.map(({ item }) => item.prepMinutes));
}

/**
 * Minutes knocked off each order already in the queue. The kitchen overlaps
 * work (the next kota goes on while the last one is wrapped), so the queue
 * moves a bit faster than the orders' prep times added up.
 */
export const QUEUE_OVERLAP_MINUTES = 2;

/** How many orders each category can cook at once. Categories not listed can do one. */
export type CategoryCapacity = Readonly<Record<string, number>>;

function capacityOf(capacity: CategoryCapacity, category: string): number {
  return Math.max(1, capacity[category] ?? 1);
}

/** How long the order holds up a category: its slowest item there. 0 if nothing cooks there. */
function prepInCategory(order: Pick<Order, 'lines'>, category: string): number {
  return order.lines.reduce(
    (slowest, line) => (line.category === category ? Math.max(slowest, line.prepMinutes) : slowest),
    0,
  );
}

/** Categories on the menu that involve cooking; drinks don't take up any kitchen time. */
export function cookedCategories(menu: readonly MenuItem[]): string[] {
  return [...new Set(menu.filter((i) => i.prepMinutes > 0).map((i) => i.category))];
}

export interface CategoryStatus {
  category: string;
  /** Orders cooking in this category right now. Paused ones free up their place. */
  cooking: Order[];
  capacity: number;
  full: boolean;
}

/** What each category is doing right now, and whether it has room for another order. */
export function kitchenStatus(
  categories: readonly string[],
  orders: readonly Order[],
  capacity: CategoryCapacity,
): CategoryStatus[] {
  return categories.map((category) => {
    const cooking = orders.filter(
      (o) => o.status === 'preparing' && !currentPause(o) && prepInCategory(o, category) > 0,
    );
    const limit = capacityOf(capacity, category);
    return { category, cooking, capacity: limit, full: cooking.length >= limit };
  });
}

/** The categories this order needs that have no room right now. */
export function fullCategories(order: Order, statuses: readonly CategoryStatus[]): string[] {
  return statuses
    .filter((s) => s.full && prepInCategory(order, s.category) > 0)
    .map((s) => s.category);
}

/**
 * How long until a category has room for one more order, given the confirmed
 * and preparing orders ahead that cook there. Each takes the first place to come
 * free: what's left of its time there, less QUEUE_OVERLAP_MINUTES. Orders in
 * other categories don't count, and neither do quotes still awaiting a yes.
 */
function waitForCategory(
  category: string,
  orders: readonly Order[],
  capacity: CategoryCapacity,
  now: number,
): { ordersAhead: number; waitMinutes: number } {
  const ahead = orders.filter(
    (o) =>
      (o.status === 'confirmed' || o.status === 'preparing') && prepInCategory(o, category) > 0,
  );
  const isCooking = (o: Order) => o.status === 'preparing' && !currentPause(o);
  const inOrder = [
    ...ahead.filter(isCooking),
    ...ahead.filter((o) => !isCooking(o)).sort(byQueueNumber),
  ];

  // Minutes until each place in the category comes free.
  const places = new Array<number>(capacityOf(capacity, category)).fill(0);
  for (const order of inOrder) {
    const cooked = order.status === 'preparing' ? Math.floor(cookingMs(order, now) / 60_000) : 0;
    const left = Math.max(0, prepInCategory(order, category) - cooked - QUEUE_OVERLAP_MINUTES);
    places[places.indexOf(Math.min(...places))]! += left;
  }
  return { ordersAhead: ahead.length, waitMinutes: Math.min(...places) };
}

export interface ReadyEstimate {
  /** One entry per category the order needs cooked. */
  categories: {
    category: string;
    prepMinutes: number;
    ordersAhead: number;
    waitMinutes: number;
  }[];
  /** What to tell the customer: when the last of those categories will be done. */
  totalMinutes: number;
}

/**
 * Ready time to tell the customer. Each category works on its own, so an order
 * only waits for orders in the categories it needs: a kota isn't held up by pap.
 * For each of those categories it's the wait for room there plus the slowest
 * item from it, and the order is ready when the last one finishes. Orders with
 * nothing to cook are handed over straight away.
 */
export function estimateReadyTime(
  lines: readonly OrderLine[],
  orders: readonly Order[],
  capacity: CategoryCapacity,
  now: number,
): ReadyEstimate {
  const order = { lines: [...lines] };
  const needed = [...new Set(lines.map((l) => l.category))].filter(
    (category) => prepInCategory(order, category) > 0,
  );
  const categories = needed.map((category) => ({
    category,
    prepMinutes: prepInCategory(order, category),
    ...waitForCategory(category, orders, capacity, now),
  }));
  const totalMinutes = Math.max(0, ...categories.map((c) => c.waitMinutes + c.prepMinutes));
  return { categories, totalMinutes };
}

/**
 * Order lifecycle:
 *   awaiting  → quoted to the customer (e.g. on WhatsApp), waiting for their "yes"
 *   confirmed → customer committed, waiting for the kitchen to start
 *   preparing → being made
 *   ready     → waiting for pickup
 *   done      → collected
 * Any order that is not done can be cancelled.
 */
export type OrderStatus = 'awaiting' | 'confirmed' | 'preparing' | 'ready' | 'done' | 'cancelled';

export interface OrderLine {
  itemId: string;
  name: string;
  category: string;
  /** Average prep time when ordered, which decides how long it holds up its category. */
  prepMinutes: number;
  quantity: number;
  priceCents: Cents;
}

export type PaymentMethod = 'cash' | 'card';

export interface Order {
  id: string;
  queueNumber: number;
  channel: OrderChannel;
  /** How the customer said they'll pay, so staff know what to collect at pickup. */
  paymentMethod: PaymentMethod;
  customerName?: string;
  /** E.164, when the customer gave a number. */
  phone?: string;
  /** Name and price are copied at order time so later menu changes don't rewrite history. */
  lines: OrderLine[];
  totalCents: Cents;
  /** How long this order takes to make on its own (see orderPrepMinutes). */
  prepMinutes: number;
  /** Ready time the customer was given, including the queue ahead of them. */
  readyMinutes: number;
  /** The moment that ready time runs out. Set when the order is confirmed; quotes don't have one. */
  readyBy?: number;
  status: OrderStatus;
  createdAt: number;
  /** When the order entered its current status; drives "Waiting 9 min". */
  statusChangedAt: number;
  /** When the kitchen pressed Start; the timer on the order counts from here. */
  startedAt?: number;
  /** When it was marked ready. With startedAt, this is how long it really took to make. */
  readyAt?: number;
  /** Every time cooking was paused, oldest first. The last one is open while it's paused. */
  pauses?: OrderPause[];
  /** What the customer asked for that the menu doesn't cover, e.g. "only spice". */
  specialRequest?: string;
  /** Items changed after Start, so its timing isn't used to learn prep times. */
  editedWhileCooking?: boolean;
}

export interface OrderPause {
  reason: string;
  pausedAt: number;
  /** Missing while the order is still paused. */
  resumedAt?: number;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  awaiting: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'done',
};

/**
 * Moves the order one step along its lifecycle. Done and cancelled orders are
 * unchanged, and so are paused ones: they have to be resumed first.
 */
export function advanceOrder(order: Order, now: number): Order {
  const next = NEXT_STATUS[order.status];
  if (!next || currentPause(order)) return order;
  return {
    ...order,
    status: next,
    statusChangedAt: now,
    ...(next === 'preparing' && { startedAt: now }),
    ...(next === 'ready' && { readyAt: now }),
  };
}

/** The pause the order is in right now, if any. */
export function currentPause(order: Order): OrderPause | null {
  const last = order.pauses?.at(-1);
  return last && last.resumedAt === undefined ? last : null;
}

/** Stops the timer on an order being made. A reason is required. */
export function pauseOrder(order: Order, reason: string, now: number): Order {
  const trimmed = reason.trim();
  if (order.status !== 'preparing' || currentPause(order) || !trimmed) return order;
  return { ...order, pauses: [...(order.pauses ?? []), { reason: trimmed, pausedAt: now }] };
}

export function resumeOrder(order: Order, now: number): Order {
  if (!currentPause(order)) return order;
  const pauses = order.pauses!.map((p) =>
    p.resumedAt === undefined ? { ...p, resumedAt: now } : p,
  );
  return { ...order, pauses };
}

function pausedMs(order: Order, until: number): number {
  return (order.pauses ?? []).reduce(
    (sum, pause) => sum + (pause.resumedAt ?? until) - pause.pausedAt,
    0,
  );
}

/** Time spent actually cooking so far: since Start, leaving out any pauses. */
export function cookingMs(order: Order, now: number): number {
  const start = order.startedAt ?? order.statusChangedAt;
  return now - start - pausedMs(order, now);
}

/**
 * How long the order really took to make, or null if it wasn't timed from Start
 * to Ready. Pauses are left out so a power cut doesn't skew the learned times.
 */
export function actualPrepMs(order: Order): number | null {
  if (order.startedAt === undefined || order.readyAt === undefined) return null;
  return cookingMs(order, order.readyAt);
}

/** Timer text: "04:12", or "1:04:12" past an hour. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Real timings needed before an item's prep time stops being the menu's guess. */
const TIMINGS_BEFORE_LEARNING = 3;

/**
 * The menu with prep times replaced by what the kitchen really takes, once an
 * item has enough timed orders. Each timing counts towards the order's slowest
 * item, since that's the one that decides how long the order takes. Uses the
 * median so one forgotten Ready button or mis-tap doesn't skew the time.
 */
export function withLearnedPrepTimes(
  menu: readonly MenuItem[],
  orders: readonly Order[],
): MenuItem[] {
  const prepOf = (itemId: string) => menu.find((i) => i.id === itemId)?.prepMinutes ?? 0;
  const timings = new Map<string, number[]>();

  for (const order of orders) {
    const actual = actualPrepMs(order);
    // Items changed mid-cook, so the timer doesn't measure any one set of items.
    if (actual === null || order.editedWhileCooking) continue;
    const slowest = order.lines.reduce<OrderLine | null>(
      (best, line) => (!best || prepOf(line.itemId) > prepOf(best.itemId) ? line : best),
      null,
    );
    if (!slowest || prepOf(slowest.itemId) === 0) continue;
    timings.set(slowest.itemId, [...(timings.get(slowest.itemId) ?? []), actual]);
  }

  return menu.map((item) => {
    const times = timings.get(item.id);
    if (!times || times.length < TIMINGS_BEFORE_LEARNING) return item;
    return { ...item, prepMinutes: Math.max(1, Math.ceil(median(times) / 60_000)) };
  });
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function cancelOrder(order: Order, now: number): Order {
  if (order.status === 'done' || order.status === 'cancelled') return order;
  return { ...order, status: 'cancelled', statusChangedAt: now };
}

export function buildOrderLines(menu: readonly MenuItem[], lines: OrderLines): OrderLine[] {
  return selectedItems(menu, lines).map(({ item, quantity }) => ({
    itemId: item.id,
    name: item.name,
    category: item.category,
    prepMinutes: item.prepMinutes,
    quantity,
    priceCents: item.priceCents,
  }));
}

/** Oldest first, so the queue is served in order. */
export function byQueueNumber(a: Order, b: Order): number {
  return a.queueNumber - b.queueNumber;
}

export function nextQueueNumber(orders: readonly Order[], firstNumber = 1): number {
  return orders.reduce((max, order) => Math.max(max, order.queueNumber + 1), firstNumber);
}

/** Every menu category in the order, e.g. ["Kotas", "Drinks"]. */
export function orderCategories(order: Order): string[] {
  return [...new Set(order.lines.map((line) => line.category))];
}

/** Orders taking at least this long to make count as long ones. */
export const LONG_PREP_MINUTES = 15;

export function isLongOrder(order: Order): boolean {
  return order.prepMinutes >= LONG_PREP_MINUTES;
}

/** The latest the kitchen can start and still make the ready time the customer was told. */
export function mustStartBy(order: Order): number {
  const readyBy = order.readyBy ?? readyByTime(order.statusChangedAt, order.readyMinutes);
  return readyBy - order.prepMinutes * 60_000;
}

/**
 * Minutes left to start the order on time, or 0 when it has to start now.
 */
export function minutesToStart(order: Order, now: number): number {
  return Math.max(0, Math.ceil((mustStartBy(order) - now) / 60_000));
}

/**
 * The order to work through. Orders that can't start yet (`isBlocked`, because
 * their category is full) go below the ones that can. Then anything that has to
 * start now comes first, most
 * overdue on top, so nobody gets skipped. After that the longest cook goes
 * first: it needs the head start, and quick orders can be fitted in around it.
 */
export function byPriority(
  orders: readonly Order[],
  now: number,
  isBlocked: (order: Order) => boolean = () => false,
): Order[] {
  return [...orders].sort((a, b) => {
    if (isBlocked(a) !== isBlocked(b)) return isBlocked(a) ? 1 : -1;
    const aStartsIn = mustStartBy(a) - now;
    const bStartsIn = mustStartBy(b) - now;
    const aUrgent = aStartsIn <= 0;
    const bUrgent = bStartsIn <= 0;
    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
    if (aUrgent) return aStartsIn - bStartsIn;
    return b.prepMinutes - a.prepMinutes || byQueueNumber(a, b);
  });
}

/** Whole minutes between two timestamps, never negative. */
export function minutesBetween(from: number, to: number): number {
  return Math.max(0, Math.floor((to - from) / 60_000));
}

export function readyByTime(confirmedAt: number, readyMinutes: number): number {
  return confirmedAt + readyMinutes * 60_000;
}

/**
 * Minutes past the ready time the customer was told (at least 1), or null if
 * the order isn't late. Only orders still to be finished can be late: once it's
 * ready the wait is over, and orders with nothing to cook have no ready time.
 */
export function minutesLate(order: Order, now: number): number | null {
  if (order.status !== 'confirmed' && order.status !== 'preparing') return null;
  if (order.readyBy === undefined || order.readyMinutes === 0 || now <= order.readyBy) return null;
  return Math.max(1, minutesBetween(order.readyBy, now));
}

/** Who to call out: their name, or the channel when we don't have one. */
export function orderDisplayName(order: Pick<Order, 'customerName' | 'channel'>): string {
  if (order.customerName) return order.customerName;
  return { call: 'Caller', whatsapp: 'WhatsApp', 'walk-in': 'Walk-in' }[order.channel];
}

/** Turns saved order lines back into quantities, e.g. to edit them in the menu picker. */
export function toOrderLines(lines: readonly OrderLine[]): OrderLines {
  return Object.fromEntries(lines.map((l) => [l.itemId, l.quantity]));
}

/** Whether two sets of lines keep every category busy for the same time. */
function sameCookingTime(a: readonly OrderLine[], b: readonly OrderLine[]): boolean {
  const categories = new Set([...a, ...b].map((line) => line.category));
  return [...categories].every(
    (category) =>
      prepInCategory({ lines: [...a] }, category) === prepInCategory({ lines: [...b] }, category),
  );
}

/**
 * Replaces the items on an order that hasn't been finished. Edits that leave
 * no items, or orders already ready, are unchanged. `orders` is today's list.
 *
 * - Quote: re-estimated against the queue, and the quote clock restarts because
 *   they need the new quote before saying yes.
 * - Confirmed: keeps its place. If the cooking changed, the ready time is
 *   re-estimated against only the orders ahead of it.
 * - Preparing: the timer keeps running and the ready time moves by however much
 *   the order's prep time changed.
 */
export function editOrderItems(
  order: Order,
  menu: readonly MenuItem[],
  lines: OrderLines,
  orders: readonly Order[],
  capacity: CategoryCapacity,
  now: number,
): Order {
  const editable =
    order.status === 'awaiting' || order.status === 'confirmed' || order.status === 'preparing';
  if (!editable || orderItemCount(lines) === 0) return order;

  const prepMinutes = orderPrepMinutes(menu, lines);
  const newLines = buildOrderLines(menu, lines);
  const edited: Order = {
    ...order,
    lines: newLines,
    totalCents: orderTotalCents(menu, lines),
    prepMinutes,
  };

  if (order.status === 'awaiting') {
    return {
      ...edited,
      readyMinutes: estimateReadyTime(newLines, orders, capacity, now).totalMinutes,
      statusChangedAt: now,
    };
  }

  if (sameCookingTime(order.lines, newLines)) return edited;

  if (order.status === 'confirmed') {
    const ahead = orders.filter(
      (o) =>
        o.id !== order.id &&
        (o.status === 'preparing' ||
          (o.status === 'confirmed' && o.queueNumber < order.queueNumber)),
    );
    const readyMinutes = estimateReadyTime(newLines, ahead, capacity, now).totalMinutes;
    return { ...edited, readyMinutes, readyBy: readyByTime(now, readyMinutes) };
  }

  const changeMinutes = prepMinutes - order.prepMinutes;
  return {
    ...edited,
    readyMinutes: Math.max(0, order.readyMinutes + changeMinutes),
    readyBy: order.readyBy === undefined ? undefined : order.readyBy + changeMinutes * 60_000,
    editedWhileCooking: true,
  };
}

/** Whole minutes until the order should be ready; at least 1 while cooking is still owed. */
export function minutesUntilReady(order: Order, now: number): number {
  if (order.readyMinutes === 0) return 0;
  if (order.readyBy === undefined) return order.readyMinutes;
  return Math.max(1, Math.ceil((order.readyBy - now) / 60_000));
}

/**
 * The customer said yes to a quote. The queue may have grown since we quoted,
 * so the ready time is re-estimated against the queue as it is now.
 */
export function confirmQuote(
  order: Order,
  orders: readonly Order[],
  capacity: CategoryCapacity,
  now: number,
): Order {
  if (order.status !== 'awaiting') return order;
  const readyMinutes = estimateReadyTime(order.lines, orders, capacity, now).totalMinutes;
  return {
    ...order,
    status: 'confirmed',
    statusChangedAt: now,
    readyMinutes,
    readyBy: readyByTime(now, readyMinutes),
  };
}

export interface RepeatCustomer {
  /** The name from their most recent order that had one. */
  name?: string;
  /** How they most often order; ties go to the most recent. */
  preferredChannel: OrderChannel;
}

/** Looks up someone who has ordered before by their E.164 number. Null if they're new. */
export function findRepeatCustomer(orders: readonly Order[], phone: string): RepeatCustomer | null {
  const past = orders
    .filter((o) => o.phone === phone && o.status !== 'cancelled')
    .sort(byQueueNumber);
  if (past.length === 0) return null;

  const counts = new Map<OrderChannel, number>();
  let preferredChannel = past[0]!.channel;
  let best = 0;
  for (const { channel } of past) {
    const count = (counts.get(channel) ?? 0) + 1;
    counts.set(channel, count);
    if (count >= best) {
      best = count;
      preferredChannel = channel;
    }
  }
  return { name: past.findLast((o) => o.customerName)?.customerName, preferredChannel };
}
