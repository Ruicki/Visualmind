/**
 * @file App.jsx
 * @description Orquestador central de la aplicación.
 * Define la estructura de rutas, gestiona la jerarquía de contextos (Providers)
 * y controla efectos globales como el scroll y animaciones de entrada.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Páginas principales (Publicas)
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
import OrderSuccess from './pages/OrderSuccess';

// Páginas de administración (Protegidas)
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminSeasons from './pages/admin/AdminSeasons';
import AdminCollections from './pages/admin/AdminCollections';
import AdminCategories from './pages/admin/AdminCategories';

// Contextos de Estado Global
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Componentes de Interfaz Global
import AdminRoute from './components/AdminRoute';
import Cart from './components/Cart';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import SEO from './components/SEO';
import ScrollToTopButton from './components/ScrollToTopButton';

/**
 * PageController
 * @component
 * @description Componente funcional encargado de efectos colaterales al cambiar de ruta.
 * 1. Resetea el scroll a la posición inicial (0,0).
 * 2. Gestiona el IntersectionObserver para elementos con la clase '.reveal' (animaciones de entrada).
 * 3. Implementa un 'safeguard' para asegurar la visibilidad si el observador falla.
 */
function PageController() {
  const location = useLocation();

  useEffect(() => {
    // 1. Reset de scroll instantáneo
    window.scrollTo(0, 0);

    // 2. Configuración del Observer para animaciones de revelación
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

    // Pequeño delay para asegurar que el DOM post-renderizado está listo
    const timeoutId = setTimeout(() => {
      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach(el => observer.observe(el));
      
      /**
       * Safeguard: Forzar visibilidad después de 2 segundos.
       * Previene que elementos queden invisibles si el observer no se dispara
       * debido a layouts complejos o errores de carga.
       */
      const forceVisibleId = setTimeout(() => {
        revealElements.forEach(el => {
          if (!el.classList.contains('visible')) {
            el.classList.add('reveal-stuck');
          }
        });
      }, 2000);
      
      return () => clearTimeout(forceVisibleId);
    }, 100);

    // Limpieza de efectos al desmontar o cambiar de ruta
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [location]);

  return null;
}

/**
 * InnerApp
 * @component
 * @description Contiene la lógica interna de la aplicación, incluyendo la jerarquía de Providers.
 * Los providers están anidados según su dependencia lógica:
 * Theme -> Auth -> Wishlist -> Cart.
 */
function InnerApp() {
  const location = useLocation();
  const esRutaAdmin = location.pathname.startsWith('/admin');

  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
          {/* SEO Base: Se actualiza dinámicamente en componentes de página específicos si es necesario */}
          <SEO 
            title="Home" 
            description="Visualmind - Tu tienda de moda premium con las últimas tendencias."
          />
          
          <PageController />

          {/* UI Condicional: El Navbar y Footer se ocultan en el panel de administración */}
          {!esRutaAdmin && <Navbar />}
          
          <ScrollToTopButton />
          
          {!esRutaAdmin && <WhatsAppButton />}

          <Routes>
            {/* Rutas Públicas */}
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
            <Route path="/order-success" element={<OrderSuccess />} />

            {/* Rutas de Administración Protegidas por AdminRoute */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="campaigns" element={<AdminCampaigns />} />
              <Route path="seasons" element={<AdminSeasons />} />
              <Route path="collections" element={<AdminCollections />} />
              <Route path="categories" element={<AdminCategories />} />
            </Route>
          </Routes>

          {/* Componente de Carrito Lateral (Drawer) */}
          <Cart />

          {!esRutaAdmin && <Footer />}
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * App (Root)
 * @component
 * @description Envuelve la aplicación en el Router de React Router DOM.
 */
function App() {
  return (
    <Router>
      <InnerApp />
    </Router>
  );
}

export default App;

