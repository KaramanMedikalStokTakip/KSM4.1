import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { API } from '../App';
import { Button } from './ui/button';
import { LayoutDashboard, Package, ShoppingCart, Users, FileText, Calendar as CalendarIcon, Settings as SettingsIcon, LogOut, Menu, X, DollarSign, Euro, TrendingUp } from 'lucide-react';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobilde kapalı başlar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState(null);

  // Ekran boyutunu dinle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
        setMobileMenuOpen(false);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCurrency();
    const interval = setInterval(fetchCurrency, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchCurrency = async () => {
    try {
      const response = await axios.get(`${API}/currency`);
      setCurrency(response.data);
    } catch (error) {
      console.error('Currency fetch error:', error);
    }
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/stock', icon: Package, label: 'Stok Yönetimi' },
    { path: '/pos', icon: ShoppingCart, label: 'Kasiyer / POS' },
    { path: '/customers', icon: Users, label: 'Müşteriler' },
    { path: '/reports', icon: FileText, label: 'Raporlar' },
    { path: '/calendar', icon: CalendarIcon, label: 'Takvim' },
    { path: '/settings', icon: SettingsIcon, label: 'Ayarlar' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Currency Ticker */}
      {currency && (
        <div className="currency-ticker" data-testid="currency-ticker">
          <div className="currency-scroll">
            <div className="currency-item">
              <DollarSign className="w-4 h-4" />
              <span>USD/TRY: ₺{currency.usd_try}</span>
            </div>
            <div className="currency-item">
              <Euro className="w-4 h-4" />
              <span>EUR/TRY: ₺{currency.eur_try}</span>
            </div>
            <div className="currency-item">
              <TrendingUp className="w-4 h-4" />
              <span>Altın: ₺{currency.gold_try}</span>
            </div>
            <div className="currency-item">
              <TrendingUp className="w-4 h-4" />
              <span>Gümüş: ₺{currency.silver_try}</span>
            </div>
            {/* Duplicate for seamless loop */}
            <div className="currency-item">
              <DollarSign className="w-4 h-4" />
              <span>USD/TRY: ₺{currency.usd_try}</span>
            </div>
            <div className="currency-item">
              <Euro className="w-4 h-4" />
              <span>EUR/TRY: ₺{currency.eur_try}</span>
            </div>
            <div className="currency-item">
              <TrendingUp className="w-4 h-4" />
              <span>Altın: ₺{currency.gold_try}</span>
            </div>
            <div className="currency-item">
              <TrendingUp className="w-4 h-4" />
              <span>Gümüş: ₺{currency.silver_try}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-white border-r transition-all duration-300 min-h-screen flex flex-col`}
          data-testid="sidebar"
        >
          <div className="p-4 border-b flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Karaman Sağlık Logo" className="h-12 w-auto object-contain" />
              </div>
            )}
            {!sidebarOpen && (
              <div className="flex items-center justify-center w-full">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="toggle-sidebar-btn"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  data-testid={`nav-${item.path}`}
                >
                  <Icon className="w-5 h-5" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <div className={`${sidebarOpen ? 'mb-3' : 'mb-2'}`}>
              {sidebarOpen && (
                <div>
                  <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={logout}
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">Çıkış</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;