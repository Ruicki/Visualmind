import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Páginas principales
import Home from './pages/Home';
import Shop from './pages/Shop';
import Collections from './pages/Collections';
import NewArrivals from './pages/NewArrivals';
import About from './pages/About';
import Checkout from './pages/Checkout';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Lookbook from './pages/Lookbook';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';
import InfoPage from './pages/InfoPage';

// Páginas de administración
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettings from './pages/admin/AdminSettings';

// Contextos (LanguageProvider se provee desde main.jsx)
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';

// Componentes globales
import AdminRoute from './components/AdminRoute';
import Cart from './components/Cart';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import SEO from './components/SEO';
import ScrollToTopButton from './components/ScrollToTopButton';

/**
 * Controlador de página: gestiona scroll al inicio y
 * animaciones de revelación al cambiar de ruta
 */
function PageController() {
  const location = useLocation();

  useEffect(() => {
    // Volver al inicio al navegar
    window.scrollTo(0, 0);

    // Re-inicializar observer para animaciones de revelación
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Pequeño delay para que el DOM se actualice
    const timeoutId = setTimeout(() => {
      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [location]);

  return null;
}

/**
 * Layout interno de la app con rutas y providers
 */
function InnerApp() {
  const location = useLocation();
  const esRutaAdmin = location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <SEO 
            title="Home" 
            description="Visualmind - Tu tienda de moda premium con las últimas tendencias."
          />
          <PageController />
          {!esRutaAdmin && <Navbar />}
          <ScrollToTopButton />
          {!esRutaAdmin && <WhatsAppButton />}
          <Routes>
            {/* ... restantes rutas ... */}
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/new-arrivals" element={<NewArrivals />} />
            <Route path="/about" element={<About />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/lookbook" element={<Lookbook />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/info/:page" element={<InfoPage />} />

            {/* Rutas de administración */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
          <Cart />
          {!esRutaAdmin && <Footer />}
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

/**
 * Componente raíz con Router
 */
function App() {
  return (
    <Router>
      <InnerApp />
    </Router>
  );
}

export default App;
