import { BrowserRouter, Route, Routes } from 'react-router';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { OrderDetailScreen } from '../features/orders/OrderDetailScreen';
import { NewOrderScreen } from '../features/orders/NewOrderScreen';
import { OrdersBoardScreen } from '../features/orders/OrdersBoardScreen';
import { OrdersProvider } from '../features/orders/OrdersProvider';

export function App() {
  return (
    <OrdersProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/orders" element={<OrdersBoardScreen />} />
          <Route path="/orders/new" element={<NewOrderScreen />} />
          <Route path="/orders/:orderId" element={<OrderDetailScreen />} />
        </Routes>
      </BrowserRouter>
    </OrdersProvider>
  );
}
