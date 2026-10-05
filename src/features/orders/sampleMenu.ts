import type { MenuItem } from '../../domain/orders';

// Placeholder menu until the menu feature and backend exist.
export const SAMPLE_MENU: MenuItem[] = [
  { id: 'kota', name: 'Kota', category: 'meals', priceCents: 3500, prepMinutes: 10 },
  { id: 'vetkoek', name: 'Vetkoek & mince', category: 'meals', priceCents: 3000, prepMinutes: 8 },
  {
    id: 'bunny',
    name: 'Bunny chow',
    category: 'meals',
    priceCents: 5500,
    prepMinutes: 12,
    soldOut: true,
  },
  { id: 'coke', name: 'Coke 500ml', category: 'drinks', priceCents: 1800, prepMinutes: 0 },
  { id: 'juice', name: 'Fruit juice 330ml', category: 'drinks', priceCents: 1500, prepMinutes: 0 },
  { id: 'chips', name: 'Extra chips', category: 'extras', priceCents: 1000, prepMinutes: 5 },
  { id: 'cheese', name: 'Cheese slice', category: 'extras', priceCents: 500, prepMinutes: 0 },
  { id: 'russian', name: 'Russian', category: 'extras', priceCents: 1200, prepMinutes: 4 },
];
