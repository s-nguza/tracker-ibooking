import { BrowserRouter, Route, Routes } from 'react-router';
import { OrderDetailScreen } from '../features/orders/OrderDetailScreen';
import { NewOrderScreen } from '../features/orders/NewOrderScreen';
import { OrdersBoardScreen } from '../features/orders/OrdersBoardScreen';
import { OrdersProvider } from '../features/orders/OrdersProvider';

export function App() {
  return (
    <OrdersProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OrdersBoardScreen />} />
          <Route path="/orders/new" element={<NewOrderScreen />} />
          <Route path="/orders/:orderId" element={<OrderDetailScreen />} />
        </Routes>
      </BrowserRouter>
    </OrdersProvider>
  );
}
