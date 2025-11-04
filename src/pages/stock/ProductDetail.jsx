import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { productService } from '../../services/productService';
import { Sidebar } from '../../components/common/Sidebar';
import {
  ArrowLeftIcon,
  CubeIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon,
  BanknotesIcon,
  TagIcon,
  ArchiveBoxIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import './ProductDetail.css';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [product, setProduct] = useState(null);
  const [locations, setLocations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (company?.id && productId) {
      loadProductData();
    }
  }, [company?.id, productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const [productData, locationsData, movementsData] = await Promise.all([
        productService.getProduct(company.id, productId),
        productService.getStockLocations(company.id, productId),
        productService.getStockMovements(company.id, productId, 20)
      ]);

      setProduct(productData);
      setLocations(locationsData);
      setMovements(movementsData);
    } catch (err) {
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="product-detail-page" style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{language === 'pt' ? 'A carregar...' : 'Loading...'}</p>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="product-detail-page" style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}>
          <div className="error-state">
            <p>{language === 'pt' ? 'Produto não encontrado' : 'Product not found'}</p>
            <button onClick={() => navigate('/stock')} className="btn-primary">
              {language === 'pt' ? 'Voltar ao Stock' : 'Back to Stock'}
            </button>
          </div>
        </div>
      </>
    );
  }

  const totalStock = locations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);
  const totalValue = totalStock * (product.price || 0);
  const averageLocationStock = locations.length > 0 ? totalStock / locations.length : 0;

  const getStockStatus = () => {
    if (totalStock === 0) return { label: 'Out of Stock', class: 'out' };
    if (totalStock <= (product.minStock || 0)) return { label: 'Low Stock', class: 'low' };
    return { label: 'In Stock', class: 'in' };
  };

  const stockStatus = getStockStatus();

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="product-detail-page" style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}>
        {/* Header */}
        <div className="page-header">
          <button onClick={() => navigate('/stock')} className="btn-back">
            <ArrowLeftIcon className="icon-sm" />
            {language === 'pt' ? 'Voltar' : 'Back'}
          </button>
          <div className="header-content">
            <h1>{product.name}</h1>
            <div className="product-meta">
              <span className="meta-item">
                <TagIcon className="icon-sm" />
                {product.reference}
              </span>
              <span className={`stock-badge ${stockStatus.class}`}>
                {stockStatus.label}
              </span>
            </div>
          </div>
          <button onClick={loadProductData} className="btn-refresh">
            <ArrowPathIcon className="icon-sm" />
            {language === 'pt' ? 'Atualizar' : 'Refresh'}
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-icon stock">
              <CubeIcon />
            </div>
            <div className="card-content">
              <div className="card-label">{language === 'pt' ? 'Stock Total' : 'Total Stock'}</div>
              <div className="card-value">{totalStock} {product.unit}</div>
              {product.minStock && (
                <div className="card-hint">
                  {language === 'pt' ? 'Mínimo:' : 'Minimum:'} {product.minStock}
                </div>
              )}
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon value">
              <BanknotesIcon />
            </div>
            <div className="card-content">
              <div className="card-label">{language === 'pt' ? 'Valor Total' : 'Total Value'}</div>
              <div className="card-value">€{totalValue.toFixed(2)}</div>
              <div className="card-hint">
                {language === 'pt' ? 'Preço:' : 'Price:'} €{(product.price || 0).toFixed(2)}/{product.unit}
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon locations">
              <MapPinIcon />
            </div>
            <div className="card-content">
              <div className="card-label">{language === 'pt' ? 'Localizações' : 'Locations'}</div>
              <div className="card-value">{locations.length}</div>
              <div className="card-hint">
                {language === 'pt' ? 'Média:' : 'Average:'} {averageLocationStock.toFixed(1)} {product.unit}
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon family">
              <ArchiveBoxIcon />
            </div>
            <div className="card-content">
              <div className="card-label">{language === 'pt' ? 'Família' : 'Family'}</div>
              <div className="card-value">{product.family || '-'}</div>
              {product.type && (
                <div className="card-hint">
                  {language === 'pt' ? 'Tipo:' : 'Type:'} {product.type}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="detail-section">
          <h2 className="section-title">
            <CubeIcon className="title-icon" />
            {language === 'pt' ? 'Detalhes do Produto' : 'Product Details'}
          </h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">{language === 'pt' ? 'Referência:' : 'Reference:'}</span>
              <span className="detail-value">{product.reference}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{language === 'pt' ? 'Família:' : 'Family:'}</span>
              <span className="detail-value">{product.family || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{language === 'pt' ? 'Tipo:' : 'Type:'}</span>
              <span className="detail-value">{product.type || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{language === 'pt' ? 'Categoria:' : 'Category:'}</span>
              <span className="detail-value">{product.category || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{language === 'pt' ? 'Preço:' : 'Price:'}</span>
              <span className="detail-value">€{(product.price || 0).toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{language === 'pt' ? 'Unidade:' : 'Unit:'}</span>
              <span className="detail-value">{product.unit}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{language === 'pt' ? 'Stock Mínimo:' : 'Minimum Stock:'}</span>
              <span className="detail-value">{product.minStock || 0} {product.unit}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{language === 'pt' ? 'Stock Total:' : 'Total Stock:'}</span>
              <span className="detail-value">{totalStock} {product.unit}</span>
            </div>
          </div>
          {product.description && (
            <div className="detail-description">
              <h3>{language === 'pt' ? 'Descrição:' : 'Description:'}</h3>
              <p>{product.description}</p>
            </div>
          )}
        </div>

        {/* Stock Locations */}
        <div className="detail-section">
          <h2 className="section-title">
            <MapPinIcon className="title-icon" />
            {language === 'pt' ? 'Stock por Localização' : 'Stock by Location'}
          </h2>
          {locations.length === 0 ? (
            <div className="empty-state">
              <MapPinIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhuma localização configurada' : 'No locations configured'}</p>
            </div>
          ) : (
            <div className="locations-list">
              {locations.map(location => {
                const locationValue = (location.quantity || 0) * (product.price || 0);
                const percentage = totalStock > 0 ? ((location.quantity || 0) / totalStock) * 100 : 0;

                return (
                  <div key={location.id} className="location-item">
                    <div className="location-header">
                      <div className="location-info">
                        <MapPinIcon className="location-icon" />
                        <div>
                          <h4>{location.name}</h4>
                          <span className="location-type">{location.type || 'warehouse'}</span>
                        </div>
                      </div>
                      <div className="location-stats">
                        <div className="stat">
                          <span className="stat-value">{location.quantity || 0} {product.unit}</span>
                          <span className="stat-label">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="stat value">
                          <span className="stat-value">€{locationValue.toFixed(2)}</span>
                          <span className="stat-label">{language === 'pt' ? 'valor' : 'value'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock Movements */}
        <div className="detail-section">
          <h2 className="section-title">
            <ClockIcon className="title-icon" />
            {language === 'pt' ? 'Histórico de Movimentos' : 'Movement History'}
          </h2>
          {movements.length === 0 ? (
            <div className="empty-state">
              <ClockIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhum movimento registado' : 'No movements recorded'}</p>
            </div>
          ) : (
            <div className="movements-list">
              {movements.map(movement => (
                <div key={movement.id} className={`movement-item ${movement.type}`}>
                  <div className="movement-type">
                    {movement.type === 'entry' && '⬇️'}
                    {movement.type === 'exit' && '⬆️'}
                    {movement.type === 'transfer' && '↔️'}
                    {movement.type === 'adjustment' && '🔧'}
                  </div>
                  <div className="movement-content">
                    <div className="movement-header">
                      <span className="movement-location">{movement.locationName}</span>
                      <span className="movement-date">
                        {new Date(movement.createdAt).toLocaleDateString()} {new Date(movement.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="movement-details">
                      <span className={`movement-quantity ${movement.type}`}>
                        {movement.type === 'entry' ? '+' : '-'}{movement.quantity} {product.unit}
                      </span>
                      {movement.notes && <span className="movement-notes">{movement.notes}</span>}
                      {movement.user && <span className="movement-user">by {movement.user}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
