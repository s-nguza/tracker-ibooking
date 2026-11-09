import { formatCents, type Cents } from './money';

export interface OrderConfirmationDetails {
  queueNumber: number;
  customerName?: string;
  lines: { name: string; quantity: number }[];
  totalCents: Cents;
  readyMinutes: number;
}

export function describeLines(lines: OrderConfirmationDetails['lines']): string {
  return lines.map(({ name, quantity }) => `${name} ×${quantity}`).join(', ');
}

function firstName(customerName: string | undefined): string | undefined {
  return customerName?.split(/\s+/)[0];
}

/** "in about 15 min", or "straight away" when there's nothing to cook. */
export function readyPhrase(readyMinutes: number): string {
  return readyMinutes > 0 ? `in about ${readyMinutes} min` : 'straight away';
}

/** Text sent to the customer (e.g. on WhatsApp) once the order is confirmed. */
export function orderConfirmationMessage(details: OrderConfirmationDetails): string {
  const name = firstName(details.customerName);
  const greeting = name ? `Hi ${name}! ` : 'Hi! ';
  return [
    `${greeting}Your order #${details.queueNumber} is confirmed.`,
    describeLines(details.lines),
    `Total: ${formatCents(details.totalCents)}`,
    `Ready ${readyPhrase(details.readyMinutes)}.`,
  ].join('\n');
}

/** Text sent to a customer before they've committed; their "yes" confirms the order. */
export function orderQuoteMessage(details: OrderConfirmationDetails): string {
  const name = firstName(details.customerName);
  const greeting = name ? `Hi ${name}! ` : 'Hi! ';
  const ready =
    details.readyMinutes > 0
      ? `Ready about ${details.readyMinutes} min after you confirm.`
      : 'Ready as soon as you confirm.';
  return [
    `${greeting}Here's your order #${details.queueNumber}:`,
    describeLines(details.lines),
    `Total: ${formatCents(details.totalCents)}`,
    `${ready} Reply YES to confirm.`,
  ].join('\n');
}

/** Text sent when the items change on an order the customer already confirmed. */
export function orderUpdatedMessage(details: OrderConfirmationDetails): string {
  const name = firstName(details.customerName);
  const greeting = name ? `Hi ${name}! ` : 'Hi! ';
  return [
    `${greeting}We've updated your order #${details.queueNumber}:`,
    describeLines(details.lines),
    `New total: ${formatCents(details.totalCents)}`,
    `Ready ${readyPhrase(details.readyMinutes)}.`,
  ].join('\n');
}

export function orderReadyMessage(
  details: Pick<OrderConfirmationDetails, 'queueNumber' | 'customerName'>,
  businessName: string,
): string {
  const name = firstName(details.customerName);
  const greeting = name ? `Hi ${name}` : 'Hi';
  return `${greeting}, your order #${details.queueNumber} is ready. You can come fetch your food. - ${businessName}`;
}

/** wa.me link that opens WhatsApp with the message pre-filled. Expects an E.164 number. */
export function whatsAppLink(e164Phone: string, message: string): string {
  return `https://wa.me/${e164Phone.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;
}
