import { useAuth } from '../auth/authContext';
import { BUSINESS_NAME } from './sampleOrders';

/** The signed-in business's name, or the sample one in the offline demo. */
export function useBusinessName(): string {
  const { state } = useAuth();
  return state.status === 'ready' ? state.business.name : BUSINESS_NAME;
}
