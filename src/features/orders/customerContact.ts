import { CONTACT_RULES, type OrderChannel } from '../../domain/orders';
import { normalizeZaPhone } from '../../domain/phone';

export interface CustomerContact {
  name: string;
  phone: string;
}

/** Returns why the contact details can't be used for this channel, or null when they can. */
export function contactProblem(channel: OrderChannel, contact: CustomerContact): string | null {
  const rules = CONTACT_RULES[channel];
  const name = contact.name.trim();
  const phone = contact.phone.trim();

  if (rules.name === 'required' && !name) return "Add the caller's name";
  if (rules.phone === 'required' && !phone) return 'Add their WhatsApp number';
  if (phone && !normalizeZaPhone(phone)) return 'Check the phone number';
  return null;
}
