import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { safeToFixed } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  ArrowRightOnRectangleIcon,
  CubeIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  EnvelopeIcon,
  CalendarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { NotificationBell } from '../../components/common/NotificationBell';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const { currentUser, company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalClients: 0,
    totalSuppliers: 0,
    totalQuotations: 0,
    pendingQuotations: 0,
    approvedQuotations: 0,
    stockValue: 0,
    quotationsValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    if (company?.id) {
      loadAnalytics();
    }
  }, [company?.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load products
      const productsSnapshot = await getDocs(collection(db, 'companies', company.id, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lowStock = products.filter(p => (p.stock || 0) <= (p.minStock || 0));
      const stockValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);

      // Load clients
      const clientsSnapshot = await getDocs(collection(db, 'companies', company.id, 'clients'));

      // Load suppliers
      const suppliersSnapshot = await getDocs(collection(db, 'companies', company.id, 'suppliers'));

      // Load quotations
      const quotationsSnapshot = await getDocs(collection(db, 'companies', company.id, 'quotations'));
      const quotations = quotationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pending = quotations.filter(q => q.status === 'sent' || q.status === 'draft');
      const approved = quotations.filter(q => q.status === 'approved');
      const quotationsValue = approved.reduce((sum, q) => sum + (q.total || 0), 0);

      setAnalytics({
        totalProducts: products.length,
        lowStockProducts: lowStock.length,
        totalClients: clientsSnapshot.size,
        totalSuppliers: suppliersSnapshot.size,
        totalQuotations: quotations.length,
        pendingQuotations: pending.length,
        approvedQuotations: approved.length,
        stockValue,
        quotationsValue
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getPlanName = (plan) => {
    if (plan === 'small') return t('smallBusiness');
    if (plan === 'medium') return t('mediumBusiness');
    return t('largeEnterprise');
  };

  // Generate particles for background effect
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 15}s`,
    animationDuration: `${15 + Math.random() * 10}s`
  }));

  return (
    <div className="dashboard-container">
      {/* Animated particles background */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: particle.left,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration
            }}
          />
        ))}
      </div>

      {/* Header with glassmorphism */}
      <header className="dashboard-header">
        <div className="company-info">
          {company?.logo && (
            <img src={company.logo} alt="Logo" style={{ height: '40px' }} />
          )}
          <h1 className="company-name">
            {company?.name || 'AllInStock'}
          </h1>
        </div>
        
        <div className="user-info">
          <NotificationBell />
          <LanguageToggle />

          {/* Profile Dropdown */}
          <div className="profile-dropdown" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="profile-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <UserCircleIcon style={{ width: '24px', height: '24px' }} />
              <span className="user-email">{currentUser?.email}</span>
              <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
            </button>

            {showProfileMenu && (
              <div
                className="profile-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  background: 'rgba(30, 30, 50, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  minWidth: '200px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000
                }}
              >
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings/account');
                  }}
                  className="profile-menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Cog6ToothIcon style={{ width: '20px', height: '20px' }} />
                  <span>{t('settings') || 'Settings'}</span>
                </button>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '0.5rem 0' }} />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="profile-menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px' }} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Welcome card with glowing border */}
        <div style={{ padding: '2rem' }}>
          <div className="welcome-card">
            <h2>
              <SparklesIcon style={{ width: '32px', height: '32px', display: 'inline', marginRight: '12px', color: '#a78bfa' }} />
              {t('welcome')}
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
              {t('welcomeMessage')}
            </p>
            <div className="plan-badge">
              {t('currentPlan')}: {getPlanName(company?.plan)}
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {!loading && (
          <div className="analytics-grid">
            {/* Stock Value */}
            <div className="analytics-card">
              <div className="analytics-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                <BanknotesIcon style={{ color: '#a78bfa' }} />
              </div>
              <div className="analytics-content">
                <div className="analytics-label">{language === 'pt' ? 'Valor em Stock' : 'Stock Value'}</div>
                <div className="analytics-value">{safeToFixed(analytics.stockValue, 0)}€</div>
                <div className="analytics-subtitle">{analytics.totalProducts} {language === 'pt' ? 'produtos' : 'products'}</div>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="analytics-card" style={{ borderColor: analytics.lowStockProducts > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)' }}>
              <div className="analytics-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <ExclamationTriangleIcon style={{ color: '#ef4444' }} />
              </div>
              <div className="analytics-content">
                <div className="analytics-label">{language === 'pt' ? 'Stock Baixo' : 'Low Stock'}</div>
                <div className="analytics-value">{analytics.lowStockProducts}</div>
                <div className="analytics-subtitle">{language === 'pt' ? 'produtos abaixo do mínimo' : 'products below minimum'}</div>
              </div>
            </div>

            {/* Clients */}
            <div className="analytics-card">
              <div className="analytics-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <UsersIcon style={{ color: '#10b981' }} />
              </div>
              <div className="analytics-content">
                <div className="analytics-label">{t('clients')}</div>
                <div className="analytics-value">{analytics.totalClients}</div>
                <div className="analytics-subtitle">{language === 'pt' ? 'clientes ativos' : 'active clients'}</div>
              </div>
            </div>

            {/* Suppliers */}
            <div className="analytics-card">
              <div className="analytics-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <BuildingStorefrontIcon style={{ color: '#f59e0b' }} />
              </div>
              <div className="analytics-content">
                <div className="analytics-label">{t('suppliers')}</div>
                <div className="analytics-value">{analytics.totalSuppliers}</div>
                <div className="analytics-subtitle">{language === 'pt' ? 'fornecedores ativos' : 'active suppliers'}</div>
              </div>
            </div>

            {/* Quotations Value */}
            <div className="analytics-card">
              <div className="analytics-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <ArrowTrendingUpIcon style={{ color: '#3b82f6' }} />
              </div>
              <div className="analytics-content">
                <div className="analytics-label">{language === 'pt' ? 'Orçamentos Aprovados' : 'Approved Quotations'}</div>
                <div className="analytics-value">{safeToFixed(analytics.quotationsValue, 0)}€</div>
                <div className="analytics-subtitle">{analytics.approvedQuotations} {language === 'pt' ? 'aprovados' : 'approved'}</div>
              </div>
            </div>

            {/* Pending Quotations */}
            <div className="analytics-card">
              <div className="analytics-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                <DocumentTextIcon style={{ color: '#8b5cf6' }} />
              </div>
              <div className="analytics-content">
                <div className="analytics-label">{language === 'pt' ? 'Orçamentos Pendentes' : 'Pending Quotations'}</div>
                <div className="analytics-value">{analytics.pendingQuotations}</div>
                <div className="analytics-subtitle">{language === 'pt' ? 'aguardam resposta' : 'awaiting response'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Modules - Big Cards */}
        <div style={{ padding: '0 2rem 1rem 2rem' }}>
          <h2 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {language === 'pt' ? 'Módulos Principais' : 'Main Modules'}
          </h2>
          <div className="modules-grid">
            {/* Stock Management */}
            <div className="module-card" onClick={() => navigate('/stock')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <div className="module-icon">
                <CubeIcon style={{ width: '48px', height: '48px', color: '#a78bfa' }} />
              </div>
              <h3>{t('stockManagement')}</h3>
              <p>{t('stockDescription')}</p>
            </div>

            {/* Clients */}
            <div className="module-card" onClick={() => navigate('/clients')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <div className="module-icon">
                <UsersIcon style={{ width: '48px', height: '48px', color: '#10b981' }} />
              </div>
              <h3>{t('clients')}</h3>
              <p>{t('clientsDescription')}</p>
            </div>

            {/* Suppliers */}
            <div className="module-card" onClick={() => navigate('/suppliers')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <div className="module-icon">
                <BuildingStorefrontIcon style={{ width: '48px', height: '48px', color: '#f59e0b' }} />
              </div>
              <h3>{t('suppliers')}</h3>
              <p>{t('suppliersDescription')}</p>
            </div>

            {/* Quotations */}
            <div className="module-card" onClick={() => navigate('/quotations')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <div className="module-icon">
                <DocumentTextIcon style={{ width: '48px', height: '48px', color: '#8b5cf6' }} />
              </div>
              <h3>{language === 'pt' ? 'Orçamentos' : 'Quotations'}</h3>
              <p>{language === 'pt' ? 'Crie e gira orçamentos para clientes' : 'Create and manage quotations for clients'}</p>
            </div>

            {/* Invoices */}
            <div className="module-card" onClick={() => navigate('/invoices')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <div className="module-icon">
                <BanknotesIcon style={{ width: '48px', height: '48px', color: '#3b82f6' }} />
              </div>
              <h3>{language === 'pt' ? 'Faturas' : 'Invoices'}</h3>
              <p>{language === 'pt' ? 'Criar e gerenciar faturas de clientes' : 'Create and manage client invoices'}</p>
            </div>

            {/* Purchase Orders */}
            <div className="module-card" onClick={() => navigate('/purchase-orders')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <div className="module-icon">
                <ShoppingCartIcon style={{ width: '48px', height: '48px', color: '#ec4899' }} />
              </div>
              <h3>{language === 'pt' ? 'Encomendas' : 'Purchase Orders'}</h3>
              <p>{language === 'pt' ? 'Gerir encomendas de fornecedores' : 'Manage supplier purchase orders'}</p>
            </div>
          </div>
        </div>

        {/* Secondary Modules - Small Cards */}
        <div style={{ padding: '1rem 2rem 2rem 2rem' }}>
          <h2 style={{
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {language === 'pt' ? 'Ferramentas' : 'Tools'}
          </h2>
          <div className="modules-grid-small">
            {/* Reports */}
            <div className="module-card-small" onClick={() => navigate('/reports')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <ChartBarIcon style={{ width: '32px', height: '32px', color: '#10b981', marginBottom: '0.75rem' }} />
              <h4>{language === 'pt' ? 'Relatórios' : 'Reports'}</h4>
              <p>{language === 'pt' ? 'Análises e relatórios' : 'Analytics and reports'}</p>
            </div>

            {/* Email Hub */}
            <div className="module-card-small" onClick={() => navigate('/email-hub')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <EnvelopeIcon style={{ width: '32px', height: '32px', color: '#6366f1', marginBottom: '0.75rem' }} />
              <h4>{language === 'pt' ? 'Central de Email' : 'Email Hub'}</h4>
              <p>{language === 'pt' ? 'Gerir comunicações' : 'Manage communications'}</p>
            </div>

            {/* Calendar */}
            <div className="module-card-small" onClick={() => navigate('/calendar')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <CalendarIcon style={{ width: '32px', height: '32px', color: '#8b5cf6', marginBottom: '0.75rem' }} />
              <h4>{language === 'pt' ? 'Calendário' : 'Calendar'}</h4>
              <p>{language === 'pt' ? 'Eventos e agenda' : 'Events and schedule'}</p>
            </div>

            {/* Categories */}
            <div className="module-card-small" onClick={() => navigate('/settings/categories')} style={{ cursor: 'pointer' }}>
              <div className="card-glow"></div>
              <Cog6ToothIcon style={{ width: '32px', height: '32px', color: '#64748b', marginBottom: '0.75rem' }} />
              <h4>{language === 'pt' ? 'Categorias' : 'Categories'}</h4>
              <p>{language === 'pt' ? 'Configurações' : 'Settings'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
export { Dashboard };