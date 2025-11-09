import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import SupplierDetails from './pages/SupplierDetails';
import AddSupplier from './pages/AddSupplier';
import Performance from './pages/Performance';
import Contracts from './pages/Contracts';
import Deliveries from './pages/Deliveries';
import Quality from './pages/Quality';
import Compliance from './pages/Compliance';
import PriceComparison from './pages/PriceComparison';
import RFQManagement from './pages/RFQManagement';
import ProcurementOrders from './pages/ProcurementOrders';
import Evaluations from './pages/Evaluations';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers/:id" element={<SupplierDetails />} />
          <Route path="suppliers/new" element={<AddSupplier />} />
          <Route path="performance" element={<Performance />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="quality" element={<Quality />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="price-comparison" element={<PriceComparison />} />
          <Route path="rfq" element={<RFQManagement />} />
          <Route path="procurement" element={<ProcurementOrders />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
