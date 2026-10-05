import { BrowserRouter, Route, Routes } from 'react-router';
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
        </Routes>
      </BrowserRouter>
    </OrdersProvider>
  );
}
