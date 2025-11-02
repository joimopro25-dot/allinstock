import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { EmailsTab } from '../../components/emails/EmailsTab';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CubeIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import '../../styles/SupplierDetail.css';

const SupplierDetail = () => {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const { language } = useLanguage();
  const [supplier, setSupplier] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    if (company?.id && supplierId) {
      loadSupplierData();
    }
  }, [company?.id, supplierId]);

  const loadSupplierData = async () => {
    try {
      setLoading(true);

      // Load supplier details
      const supplierDoc = await getDoc(doc(db, 'companies', company.id, 'suppliers', supplierId));
      if (supplierDoc.exists()) {
        setSupplier({ id: supplierDoc.id, ...supplierDoc.data() });
      }

      // Load purchase orders for this supplier (when PO module is built)
      // For now, empty array
      setPurchaseOrders([]);

      // Load products from this supplier
      const productsRef = collection(db, 'companies', company.id, 'products');
      const productsQuery = query(productsRef, where('supplierId', '==', supplierId));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

    } catch (error) {
      console.error('Error loading supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US');
  };

  const calculateStats = () => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);

    return { totalProducts, totalStock, totalValue, totalPOs: purchaseOrders.length };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="supplier-detail-container">
        <div className="loading-state">{t('loading')}</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="supplier-detail-container">
        <div className="error-state">
          {language === 'pt' ? 'Fornecedor não encontrado' : 'Supplier not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-detail-container">
      {/* Header */}
      <div className="supplier-detail-header">
        <button className="back-button" onClick={() => navigate('/suppliers')}>
          <ArrowLeftIcon className="icon-sm" />
          {language === 'pt' ? 'Voltar' : 'Back'}
        </button>

        <div className="supplier-header-info">
          <div className="supplier-avatar">
            <TruckIcon className="icon-lg" />
          </div>
          <div>
            <h1 className="supplier-name">{supplier.name}</h1>
            <div className="supplier-meta">
              {supplier.taxId && (
                <span className="meta-item">
                  {language === 'pt' ? 'NIF' : 'Tax ID'}: {supplier.taxId}
                </span>
              )}
              <span className="meta-item">
                <ClockIcon className="icon-xs" />
                {language === 'pt' ? 'Fornecedor desde' : 'Supplier since'} {formatDate(supplier.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="supplier-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <CubeIcon style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">{language === 'pt' ? 'Produtos Fornecidos' : 'Products Supplied'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <DocumentTextIcon style={{ color: '#8b5cf6' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalPOs}</div>
            <div className="stat-label">{language === 'pt' ? 'Encomendas' : 'Purchase Orders'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <CubeIcon style={{ color: '#10b981' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalStock}</div>
            <div className="stat-label">{language === 'pt' ? 'Stock Total' : 'Total Stock'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <DocumentTextIcon style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalValue.toFixed(0)}€</div>
            <div className="stat-label">{language === 'pt' ? 'Valor em Stock' : 'Stock Value'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="supplier-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {language === 'pt' ? 'Visão Geral' : 'Overview'}
        </button>
        <button
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          {language === 'pt' ? 'Produtos' : 'Products'}
          <span className="tab-badge">{products.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'purchase-orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchase-orders')}
        >
          {language === 'pt' ? 'Encomendas' : 'Purchase Orders'}
          <span className="tab-badge">{purchaseOrders.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          {language === 'pt' ? 'Notas' : 'Notes'}
        </button>
        <button
          className={`tab ${activeTab === 'emails' ? 'active' : ''}`}
          onClick={() => setActiveTab('emails')}
        >
          <EnvelopeIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          {language === 'pt' ? 'Emails' : 'Emails'}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="info-card">
              <h3 className="card-title">{language === 'pt' ? 'Informação de Contacto' : 'Contact Information'}</h3>
              <div className="info-grid">
                {supplier.email && (
                  <div className="info-item">
                    <EnvelopeIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{t('email')}</div>
                      <div className="info-value">{supplier.email}</div>
                    </div>
                  </div>
                )}
                {supplier.phone && (
                  <div className="info-item">
                    <PhoneIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{language === 'pt' ? 'Telefone' : 'Phone'}</div>
                      <div className="info-value">{supplier.phone}</div>
                    </div>
                  </div>
                )}
                {supplier.address && (
                  <div className="info-item">
                    <MapPinIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{language === 'pt' ? 'Morada' : 'Address'}</div>
                      <div className="info-value">
                        {typeof supplier.address === 'string'
                          ? supplier.address
                          : [
                              supplier.address.street,
                              supplier.address.city,
                              supplier.address.postalCode,
                              supplier.address.country
                            ].filter(Boolean).join(', ')
                        }
                      </div>
                    </div>
                  </div>
                )}
                {supplier.taxId && (
                  <div className="info-item">
                    <BuildingOfficeIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{language === 'pt' ? 'NIF' : 'Tax ID'}</div>
                      <div className="info-value">{supplier.taxId}</div>
                    </div>
                  </div>
                )}
                {supplier.paymentTerms && (
                  <div className="info-item">
                    <DocumentTextIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{language === 'pt' ? 'Condições de Pagamento' : 'Payment Terms'}</div>
                      <div className="info-value">{supplier.paymentTerms}</div>
                    </div>
                  </div>
                )}
                {supplier.contactPerson && (
                  <div className="info-item">
                    <BuildingOfficeIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{language === 'pt' ? 'Pessoa de Contacto' : 'Contact Person'}</div>
                      <div className="info-value">{supplier.contactPerson}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="info-card">
              <h3 className="card-title">{language === 'pt' ? 'Resumo de Fornecimento' : 'Supply Summary'}</h3>
              <div className="activity-summary">
                <div className="summary-item">
                  <div className="summary-label">{language === 'pt' ? 'Produtos Ativos' : 'Active Products'}</div>
                  <div className="summary-value">{stats.totalProducts}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">{language === 'pt' ? 'Stock Total' : 'Total Stock'}</div>
                  <div className="summary-value">{stats.totalStock}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">{language === 'pt' ? 'Valor em Stock' : 'Stock Value'}</div>
                  <div className="summary-value">{stats.totalValue.toFixed(2)}€</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="products-content">
            {products.length === 0 ? (
              <div className="empty-state">
                <CubeIcon className="empty-icon" />
                <p>{language === 'pt' ? 'Nenhum produto deste fornecedor' : 'No products from this supplier'}</p>
              </div>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>{language === 'pt' ? 'Referência' : 'Reference'}</th>
                      <th>{language === 'pt' ? 'Nome' : 'Name'}</th>
                      <th>{language === 'pt' ? 'Família' : 'Family'}</th>
                      <th>{language === 'pt' ? 'Stock' : 'Stock'}</th>
                      <th>{language === 'pt' ? 'Preço' : 'Price'}</th>
                      <th>{language === 'pt' ? 'Valor' : 'Value'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} onClick={() => navigate('/stock')} style={{ cursor: 'pointer' }}>
                        <td>{product.reference}</td>
                        <td>{product.name}</td>
                        <td>{product.family}</td>
                        <td>{product.stock || 0}</td>
                        <td>{product.price?.toFixed(2) || '0.00'}€</td>
                        <td>{((product.stock || 0) * (product.price || 0)).toFixed(2)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'purchase-orders' && (
          <div className="purchase-orders-content">
            <div className="empty-state">
              <DocumentTextIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Módulo de Encomendas em desenvolvimento' : 'Purchase Orders module coming soon'}</p>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="notes-content">
            <div className="empty-state">
              <ClockIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Funcionalidade de notas em desenvolvimento' : 'Notes feature coming soon'}</p>
            </div>
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && supplier && (
          <EmailsTab contact={{ ...supplier, id: supplierId, type: 'supplier' }} />
        )}
      </div>
    </div>
  );
};

export default SupplierDetail;
