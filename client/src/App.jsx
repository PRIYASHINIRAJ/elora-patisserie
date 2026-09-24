import { lazy, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import { WhatsAppContextProvider } from './context/WhatsAppMessageContext';
import LoadingScreen from './components/LoadingScreen';

import CustomerLayout from './components/CustomerLayout';
import AdminLayout from './components/AdminLayout';
import RequireCustomer from './components/RequireCustomer';
import RequireAdmin from './components/RequireAdmin';

import Home from './pages/Home';
import Collection from './pages/Collection';
import CakeDetail from './pages/CakeDetail';
import CustomCake from './pages/CustomCake';
import Portfolio from './pages/Portfolio';
import OurStory from './pages/OurStory';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import Favourites from './pages/Favourites';
import Addresses from './pages/Addresses';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Messages from './pages/Messages';
import NotFound from './pages/NotFound';

import AdminLogin from './admin/AdminLogin';
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminCustomRequests = lazy(() => import('./admin/AdminCustomRequests'));
const AdminCakes = lazy(() => import('./admin/AdminCakes'));
const AdminCakeForm = lazy(() => import('./admin/AdminCakeForm'));
const AdminPortfolio = lazy(() => import('./admin/AdminPortfolio'));
const AdminPortfolioForm = lazy(() => import('./admin/AdminPortfolioForm'));
const AdminMedia = lazy(() => import('./admin/AdminMedia'));
const AdminStudioVideos = lazy(() => import('./admin/AdminStudioVideos'));
const AdminMessages = lazy(() => import('./admin/AdminMessages'));
const AdminSettings = lazy(() => import('./admin/AdminSettings'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./admin/AdminOrderDetail'));
const AdminCustomers = lazy(() => import('./admin/AdminCustomers'));
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'));

export default function App() {
  const [showLoading, setShowLoading] = useState(() => !sessionStorage.getItem('elora_intro_seen'));

  const handleLoadingComplete = () => {
    sessionStorage.setItem('elora_intro_seen', '1');
    setShowLoading(false);
  };

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <CartProvider>
          <WhatsAppContextProvider>
          {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
          <Routes>
            {/* Customer-facing site */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/cake/:slug" element={<CakeDetail />} />
              <Route path="/custom-cake" element={<CustomCake />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/our-story" element={<OurStory />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/account" element={<RequireCustomer><Account /></RequireCustomer>} />
              <Route path="/favourites" element={<RequireCustomer><Favourites /></RequireCustomer>} />
              <Route path="/addresses" element={<RequireCustomer><Addresses /></RequireCustomer>} />
              <Route path="/orders" element={<RequireCustomer><Orders /></RequireCustomer>} />
              <Route path="/orders/:id" element={<RequireCustomer><OrderDetail /></RequireCustomer>} />
              <Route path="/messages" element={<RequireCustomer><Messages /></RequireCustomer>} />
            </Route>

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="cakes" element={<AdminCakes />} />
              <Route path="cakes/new" element={<AdminCakeForm />} />
              <Route path="cakes/:id/edit" element={<AdminCakeForm />} />
              <Route path="portfolio" element={<AdminPortfolio />} />
              <Route path="portfolio/new" element={<AdminPortfolioForm />} />
              <Route path="portfolio/:id/edit" element={<AdminPortfolioForm />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="studio-videos" element={<AdminStudioVideos />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="custom-requests" element={<AdminCustomRequests />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </WhatsAppContextProvider>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
