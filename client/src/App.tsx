import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import ConfirmModal from './components/ConfirmModal';
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
import ScrollToTop from './components/ScrollToTop';
import './styles.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="app">
              <Navbar />
              <Notification />
              <ConfirmModal />
              <main className="main-content">
                <Routes>
                  {/* Ruta pública de inicio */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Ruta pública de catálogo */}
                  <Route path="/catalogo" element={<Catalogo />} />

                  {/* Rutas públicas de autenticación */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Rutas protegidas */}
                  <Route path="/dashboard" element={
                    <PrivateRoute><Dashboard /></PrivateRoute>
                  } />
                  <Route path="/inventario" element={
                    <PrivateRoute><Inventario /></PrivateRoute>
                  } />
                  <Route path="/recetas" element={
                    <PrivateRoute><Recetas /></PrivateRoute>
                  } />
                  <Route path="/ventas" element={
                    <PrivateRoute><Ventas /></PrivateRoute>
                  } />
                  <Route path="/contenido-digital" element={
                    <PrivateRoute><ContenidoDigital /></PrivateRoute>
                  } />
                  <Route path="/categorias" element={
                    <PrivateRoute><Categorias /></PrivateRoute>
                  } />
                  <Route path="/ingredientes" element={
                    <PrivateRoute><Ingredientes /></PrivateRoute>
                  } />

                  {/* Redirección para rutas no encontradas */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </ConfirmProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;