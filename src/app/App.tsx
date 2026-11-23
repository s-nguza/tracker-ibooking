import type { ReactNode } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';
import { BrandBackground } from '../components/BrandBackground';
import { useAuth } from '../features/auth/authContext';
import { AuthProvider } from '../features/auth/AuthProvider';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { RequireAuth } from '../features/auth/RequireAuth';
import { MenuProvider } from '../features/menu/MenuProvider';
import { MenuScreen } from '../features/menu/MenuScreen';
import { OrderDetailScreen } from '../features/orders/OrderDetailScreen';
import { NewOrderScreen } from '../features/orders/NewOrderScreen';
import { OrdersBoardScreen } from '../features/orders/OrdersBoardScreen';
import { OrdersProvider } from '../features/orders/OrdersProvider';

export function App() {
  return (
    <AuthProvider>
      {/* The menu sits outside the orders, which need its cooking capacities. */}
      <MenuProvider>
        <OrdersForAccount>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route element={<RequireAuth />}>
                <Route element={<NightLayout />}>
                  <Route path="/menu" element={<MenuScreen />} />
                  <Route path="/orders" element={<OrdersBoardScreen />} />
                  <Route path="/orders/new" element={<NewOrderScreen />} />
                  <Route path="/orders/:orderId" element={<OrderDetailScreen />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </OrdersForAccount>
      </MenuProvider>
    </AuthProvider>
  );
}

/** A fresh set of orders per account, so logging in as someone else never shows the last one's. */
function OrdersForAccount({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const account = state.status === 'ready' ? state.user.id : 'none';
  return <OrdersProvider key={account}>{children}</OrdersProvider>;
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
