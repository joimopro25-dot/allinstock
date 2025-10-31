import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { productService } from '../../services/productService';
import { Sidebar } from '../../components/common/Sidebar';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CurrencyEuroIcon,
  ClockIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import '../../styles/Reports.css';

export function Reports() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { company, currentUser, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    loadData();
  }, [company]);

  const loadData = async () => {
    if (!company) return;

    try {
      setLoading(true);
      const data = await productService.getProducts(company.id);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  // Calculate metrics
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + ((p.totalStock || 0) * (p.price || 0)), 0);
  const lowStockProducts = products.filter(p => p.totalStock <= p.minStock && p.minStock > 0);
  const outOfStockProducts = products.filter(p => p.totalStock === 0);

  const productsByFamily = products.reduce((acc, p) => {
    const family = p.family || 'Sem Família';
    if (!acc[family]) {
      acc[family] = { count: 0, value: 0, stock: 0 };
    }
    acc[family].count++;
    acc[family].value += (p.totalStock || 0) * (p.price || 0);
    acc[family].stock += p.totalStock || 0;
    return acc;
  }, {});

  const topValueProducts = [...products]
    .map(p => ({ ...p, value: (p.totalStock || 0) * (p.price || 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className={`reports-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="reports-header">
          <div className="header-left">
            <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              AllInStock
            </h1>
            <h2 className="page-title">
              {language === 'pt' ? 'Relatórios' : 'Reports'}
            </h2>
          </div>

          <div className="header-right">
            <LanguageToggle />
            <button className="logout-button" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">{t('loading')}</div>
        ) : (
          <>
            {/* Report Tabs */}
            <div className="report-tabs">
              <button
                className={`report-tab ${activeReport === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveReport('overview')}
              >
                <ChartBarIcon className="tab-icon" />
                {language === 'pt' ? 'Visão Geral' : 'Overview'}
              </button>
              <button
                className={`report-tab ${activeReport === 'current-stock' ? 'active' : ''}`}
                onClick={() => setActiveReport('current-stock')}
              >
                <CubeIcon className="tab-icon" />
                {language === 'pt' ? 'Stock Atual' : 'Current Stock'}
              </button>
              <button
                className={`report-tab ${activeReport === 'low-stock' ? 'active' : ''}`}
                onClick={() => setActiveReport('low-stock')}
              >
                <ExclamationTriangleIcon className="tab-icon" />
                {language === 'pt' ? 'Stock Baixo' : 'Low Stock'}
              </button>
              <button
                className={`report-tab ${activeReport === 'valuation' ? 'active' : ''}`}
                onClick={() => setActiveReport('valuation')}
              >
                <CurrencyEuroIcon className="tab-icon" />
                {language === 'pt' ? 'Avaliação' : 'Valuation'}
              </button>
            </div>

            {/* Report Content */}
            <div className="report-content">
              {activeReport === 'overview' && (
                <div className="overview-report">
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon products">
                        <CubeIcon />
                      </div>
                      <div className="metric-content">
                        <span className="metric-label">
                          {language === 'pt' ? 'Total de Produtos' : 'Total Products'}
                        </span>
                        <span className="metric-value">{totalProducts}</span>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-icon value">
                        <CurrencyEuroIcon />
                      </div>
                      <div className="metric-content">
                        <span className="metric-label">
                          {language === 'pt' ? 'Valor Total do Stock' : 'Total Stock Value'}
                        </span>
                        <span className="metric-value">€{totalStockValue.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="metric-card warning">
                      <div className="metric-icon alert">
                        <ExclamationTriangleIcon />
                      </div>
                      <div className="metric-content">
                        <span className="metric-label">
                          {language === 'pt' ? 'Stock Baixo' : 'Low Stock Alerts'}
                        </span>
                        <span className="metric-value">{lowStockProducts.length}</span>
                      </div>
                    </div>

                    <div className="metric-card danger">
                      <div className="metric-icon out">
                        <ArrowTrendingDownIcon />
                      </div>
                      <div className="metric-content">
                        <span className="metric-label">
                          {language === 'pt' ? 'Sem Stock' : 'Out of Stock'}
                        </span>
                        <span className="metric-value">{outOfStockProducts.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock by Family */}
                  <div className="report-section">
                    <h3 className="section-title">
                      {language === 'pt' ? 'Stock por Família' : 'Stock by Family'}
                    </h3>
                    <div className="family-grid">
                      {Object.entries(productsByFamily).map(([family, data]) => (
                        <div key={family} className="family-card">
                          <h4 className="family-name">{family}</h4>
                          <div className="family-stats">
                            <div className="family-stat">
                              <span className="stat-label">
                                {language === 'pt' ? 'Produtos' : 'Products'}:
                              </span>
                              <span className="stat-value">{data.count}</span>
                            </div>
                            <div className="family-stat">
                              <span className="stat-label">
                                {language === 'pt' ? 'Valor' : 'Value'}:
                              </span>
                              <span className="stat-value">€{data.value.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Value Products */}
                  <div className="report-section">
                    <h3 className="section-title">
                      {language === 'pt' ? 'Top 10 Produtos por Valor' : 'Top 10 Products by Value'}
                    </h3>
                    <div className="table-container">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>{language === 'pt' ? 'Produto' : 'Product'}</th>
                            <th>{language === 'pt' ? 'Referência' : 'Reference'}</th>
                            <th>{language === 'pt' ? 'Stock' : 'Stock'}</th>
                            <th>{language === 'pt' ? 'Preço' : 'Price'}</th>
                            <th>{language === 'pt' ? 'Valor Total' : 'Total Value'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topValueProducts.map(product => (
                            <tr key={product.id}>
                              <td className="product-name-cell">{product.name}</td>
                              <td className="reference-cell">{product.reference || '-'}</td>
                              <td>{product.totalStock} {product.unit}</td>
                              <td>€{product.price.toFixed(2)}</td>
                              <td className="value-cell">€{product.value.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeReport === 'current-stock' && (
                <div className="current-stock-report">
                  <div className="report-section">
                    <h3 className="section-title">
                      {language === 'pt' ? 'Stock Atual de Todos os Produtos' : 'Current Stock - All Products'}
                    </h3>
                    <div className="table-container">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>{language === 'pt' ? 'Produto' : 'Product'}</th>
                            <th>{language === 'pt' ? 'Referência' : 'Reference'}</th>
                            <th>{language === 'pt' ? 'Família' : 'Family'}</th>
                            <th>{language === 'pt' ? 'Stock Total' : 'Total Stock'}</th>
                            <th>{language === 'pt' ? 'Stock Mínimo' : 'Min Stock'}</th>
                            <th>{language === 'pt' ? 'Status' : 'Status'}</th>
                            <th>{language === 'pt' ? 'Valor' : 'Value'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(product => {
                            const status = product.totalStock === 0 ? 'out' :
                                         product.totalStock <= product.minStock ? 'low' : 'ok';
                            return (
                              <tr key={product.id}>
                                <td className="product-name-cell">{product.name}</td>
                                <td className="reference-cell">{product.reference || '-'}</td>
                                <td>{product.family || '-'}</td>
                                <td>{product.totalStock} {product.unit}</td>
                                <td>{product.minStock || '-'}</td>
                                <td>
                                  <span className={`status-badge ${status}`}>
                                    {status === 'out' ? (language === 'pt' ? 'Sem Stock' : 'Out') :
                                     status === 'low' ? (language === 'pt' ? 'Baixo' : 'Low') :
                                     (language === 'pt' ? 'OK' : 'OK')}
                                  </span>
                                </td>
                                <td className="value-cell">
                                  €{((product.totalStock || 0) * (product.price || 0)).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeReport === 'low-stock' && (
                <div className="low-stock-report">
                  <div className="report-section">
                    <h3 className="section-title">
                      {language === 'pt' ? 'Produtos com Stock Baixo' : 'Low Stock Products'}
                    </h3>
                    {lowStockProducts.length === 0 ? (
                      <div className="empty-report">
                        <ArrowTrendingUpIcon className="empty-icon" />
                        <p>{language === 'pt' ? 'Nenhum produto com stock baixo!' : 'No low stock products!'}</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>{language === 'pt' ? 'Produto' : 'Product'}</th>
                              <th>{language === 'pt' ? 'Stock Atual' : 'Current Stock'}</th>
                              <th>{language === 'pt' ? 'Stock Mínimo' : 'Min Stock'}</th>
                              <th>{language === 'pt' ? 'Diferença' : 'Difference'}</th>
                              <th>{language === 'pt' ? 'Qtd. Sugerida' : 'Suggested Qty'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lowStockProducts.map(product => {
                              const difference = product.minStock - product.totalStock;
                              const suggested = Math.ceil(difference * 1.5); // 50% buffer
                              return (
                                <tr key={product.id} className="warning-row">
                                  <td className="product-name-cell">{product.name}</td>
                                  <td className="danger-text">{product.totalStock} {product.unit}</td>
                                  <td>{product.minStock} {product.unit}</td>
                                  <td className="danger-text">-{difference} {product.unit}</td>
                                  <td className="success-text">{suggested} {product.unit}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeReport === 'valuation' && (
                <div className="valuation-report">
                  <div className="metrics-grid">
                    <div className="metric-card large">
                      <div className="metric-icon value">
                        <CurrencyEuroIcon />
                      </div>
                      <div className="metric-content">
                        <span className="metric-label">
                          {language === 'pt' ? 'Valor Total do Inventário' : 'Total Inventory Value'}
                        </span>
                        <span className="metric-value large">€{totalStockValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="report-section">
                    <h3 className="section-title">
                      {language === 'pt' ? 'Valor por Família' : 'Value by Family'}
                    </h3>
                    <div className="valuation-grid">
                      {Object.entries(productsByFamily)
                        .sort((a, b) => b[1].value - a[1].value)
                        .map(([family, data]) => (
                          <div key={family} className="valuation-card">
                            <h4 className="valuation-family">{family}</h4>
                            <div className="valuation-amount">€{data.value.toFixed(2)}</div>
                            <div className="valuation-detail">
                              {data.count} {language === 'pt' ? 'produtos' : 'products'}
                            </div>
                            <div className="valuation-bar">
                              <div
                                className="valuation-fill"
                                style={{ width: `${(data.value / totalStockValue) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Reports;
