import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import {
  HomeIcon,
  CubeIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import '../../styles/Sidebar.css';

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const t = (key) => getTranslation(language, key);

  const menuItems = [
    {
      path: '/dashboard',
      icon: HomeIcon,
      label: t('dashboard'),
      active: true
    },
    {
      path: '/stock',
      icon: CubeIcon,
      label: t('stockManagement'),
      active: true
    },
    {
      path: '/stock-locations',
      icon: MapPinIcon,
      label: language === 'pt' ? 'Localizações Stock' : 'Stock Locations',
      active: true
    },
    {
      path: '/reports',
      icon: ChartBarIcon,
      label: language === 'pt' ? 'Relatórios' : 'Reports',
      active: true
    },
    {
      path: '/clients',
      icon: UsersIcon,
      label: t('clients'),
      active: true
    },
    {
      path: '/suppliers',
      icon: BuildingStorefrontIcon,
      label: t('suppliers'),
      active: true
    },
    {
      path: '/quotations',
      icon: DocumentTextIcon,
      label: language === 'pt' ? 'Orçamentos' : 'Quotations',
      active: true
    },
    {
      path: '/invoices',
      icon: BanknotesIcon,
      label: language === 'pt' ? 'Faturas' : 'Invoices',
      active: true
    },
    {
      path: '/purchase-orders',
      icon: ShoppingCartIcon,
      label: language === 'pt' ? 'Encomendas' : 'Purchase Orders',
      active: true
    },
    {
      path: '/email-hub',
      icon: EnvelopeIcon,
      label: language === 'pt' ? 'Central de Email' : 'Email Hub',
      active: true
    },
    {
      path: '/calendar',
      icon: CalendarIcon,
      label: language === 'pt' ? 'Calendário' : 'Calendar',
      active: true
    },
    {
      path: '/settings/categories',
      icon: Cog6ToothIcon,
      label: language === 'pt' ? 'Categorias' : 'Categories',
      active: true
    }
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (item) => {
    if (item.active && !item.comingSoon) {
      navigate(item.path);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Logo Section */}
      <div className="sidebar-header">
        {!isCollapsed && (
          <h1 className="sidebar-logo" onClick={() => navigate('/dashboard')}>
            AllInStock
          </h1>
        )}
        {isCollapsed && (
          <div className="sidebar-logo-collapsed" onClick={() => navigate('/dashboard')}>
            AI
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''} ${
                item.comingSoon ? 'disabled' : ''
              }`}
              onClick={() => handleNavigation(item)}
              title={isCollapsed ? item.label : ''}
            >
              <div className="sidebar-item-content">
                <Icon className="sidebar-icon" />
                {!isCollapsed && (
                  <>
                    <span className="sidebar-label">{item.label}</span>
                    {item.comingSoon && (
                      <span className="coming-soon-badge">
                        {t('comingSoon')}
                      </span>
                    )}
                  </>
                )}
              </div>
              {isActive(item.path) && <div className="active-indicator" />}
            </div>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? t('expand') : t('collapse')}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="toggle-icon" />
        ) : (
          <ChevronLeftIcon className="toggle-icon" />
        )}
      </button>
    </aside>
  );
}
