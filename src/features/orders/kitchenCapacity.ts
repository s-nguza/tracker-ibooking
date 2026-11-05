import type { CategoryCapacity } from '../../domain/orders';

// How many orders each category can cook at once. Placeholder until the
// business sets its real numbers. A category not listed here can do one.
export const KITCHEN_CAPACITY: CategoryCapacity = {
  Kotas: 1,
  'Bunny chow': 1,
  'Vetkoek & snacks': 1,
  Plates: 1,
  Extras: 1,
};
