import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ThemeProvider } from './components/ThemeProvider';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import { Notification } from './components/Notification';
import ConfirmModal from './components/ConfirmModal';
import { PageTransition } from './components/PageTransition';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LandingPage from './LandingPage';
import Catalogo from './Catalogo';
import Inventario from './Inventario';
import Recetas from './Recetas';
import Ventas from './Ventas';
import ContenidoDigital from './ContenidoDigital';
import Categorias from './Categorias';
import Ingredientes from './Ingredientes';
import Clientes from './Clientes';
import HistorialVentas from './HistorialVentas';
import ScrollToTop from './components/ScrollToTop';
import './styles.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          {/* Ruta pública de inicio */}
          <Route path="/" element={<LandingPage />} />

          {/* Ruta pública de catálogo */}
          <Route path="/catalogo" element={<Catalogo />} />

          {/* Rutas públicas de autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas — admin */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/inventario"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <Inventario />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/recetas"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <Recetas />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/ventas"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <Ventas />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/historial-ventas"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <HistorialVentas />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/contenido-digital"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <ContenidoDigital />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/categorias"
            element={
              <PrivateRoute>
                <Categorias />
              </PrivateRoute>
            }
          />
          <Route
            path="/ingredientes"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <Ingredientes />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <Clientes />
                </AdminRoute>
              </PrivateRoute>
            }
          />

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <NotificationProvider>
          <ConfirmProvider>
            <CartProvider>
              <BrowserRouter>
                <ScrollToTop />
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <Notification />
                  <ConfirmModal />
                  <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <AnimatedRoutes />
                  </main>
                </div>
              </BrowserRouter>
            </CartProvider>
          </ConfirmProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
