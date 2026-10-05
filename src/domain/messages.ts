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

/** Text sent to the customer (e.g. on WhatsApp) once the order is confirmed. */
export function orderConfirmationMessage(details: OrderConfirmationDetails): string {
  const greeting = details.customerName ? `Hi ${details.customerName}! ` : 'Hi! ';
  return [
    `${greeting}Your order #${details.queueNumber} is confirmed.`,
    describeLines(details.lines),
    `Total: ${formatCents(details.totalCents)}`,
    `Ready in about ${details.readyMinutes} min.`,
  ].join('\n');
}

/** wa.me link that opens WhatsApp with the message pre-filled. Expects an E.164 number. */
export function whatsAppLink(e164Phone: string, message: string): string {
  return `https://wa.me/${e164Phone.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;
}
