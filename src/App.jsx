import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { RegisterNew } from './pages/auth/RegisterNew';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ProductList } from './pages/stock/ProductList';
import { Reports } from './pages/reports/Reports';
import { Clients } from './pages/clients/Clients';
import ClientDetail from './pages/clients/ClientDetail';
import { Suppliers } from './pages/suppliers/Suppliers';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import { Quotations } from './pages/quotations/Quotations';
import QuotationDetail from './pages/quotations/QuotationDetail';
import { Invoices } from './pages/invoices/Invoices';
import { PurchaseOrders } from './pages/purchaseOrders/PurchaseOrders';
import { ProductCategories } from './pages/settings/ProductCategories';
import { EmailHub } from './pages/emailHub/EmailHub';
import { Calendar } from './pages/calendar/Calendar';
import StockLocations from './pages/stockLocations/StockLocations';
import LandingPage from './pages/landing/LandingPage';
import AdminDashboard from './pages/admin/AdminDashboardNew';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterNew />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute>
                  <ProductList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:clientId"
              element={
                <ProtectedRoute>
                  <ClientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers/:supplierId"
              element={
                <ProtectedRoute>
                  <SupplierDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute>
                  <Quotations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/:quotationId"
              element={
                <ProtectedRoute>
                  <QuotationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute>
                  <PurchaseOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/categories"
              element={
                <ProtectedRoute>
                  <ProductCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-hub"
              element={
                <ProtectedRoute>
                  <EmailHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-locations"
              element={
                <ProtectedRoute>
                  <StockLocations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;