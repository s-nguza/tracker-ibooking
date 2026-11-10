import { BrowserRouter, Outlet, Route, Routes } from 'react-router';
import { BrandBackground } from '../components/BrandBackground';
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
          <Route element={<NightLayout />}>
            <Route path="/orders" element={<OrdersBoardScreen />} />
            <Route path="/orders/new" element={<NewOrderScreen />} />
            <Route path="/orders/:orderId" element={<OrderDetailScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </OrdersProvider>
  );
}

/** The register screen's backdrop behind the order screens. */
function NightLayout() {
  return (
    <div className="relative isolate h-full">
      <BrandBackground glow="register" fixed />
      <Outlet />
    </div>
  );
}
