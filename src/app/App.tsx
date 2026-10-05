import { BrowserRouter, Route, Routes } from 'react-router';
import { NewOrderScreen } from '../features/orders/NewOrderScreen';
import { HomePage } from './HomePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/orders/new" element={<NewOrderScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
