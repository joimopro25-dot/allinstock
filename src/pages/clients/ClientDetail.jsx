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
  UserIcon
} from '@heroicons/react/24/outline';
import '../../styles/ClientDetail.css';

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const { language } = useLanguage();
  const [client, setClient] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [stockLocations, setStockLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    if (company?.id && clientId) {
      loadClientData();
    }
  }, [company?.id, clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);

      // Load client details
      const clientDoc = await getDoc(doc(db, 'companies', company.id, 'clients', clientId));
      if (clientDoc.exists()) {
        setClient({ id: clientDoc.id, ...clientDoc.data() });
      }

      // Load quotations for this client
      const quotationsRef = collection(db, 'companies', company.id, 'quotations');
      const quotationsQuery = query(quotationsRef, where('clientId', '==', clientId));
      const quotationsSnapshot = await getDocs(quotationsQuery);
      const quotationsData = quotationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuotations(quotationsData);

      // Load stock locations at this client
      const productsRef = collection(db, 'companies', company.id, 'products');
      const productsSnapshot = await getDocs(productsRef);

      const clientStockLocations = [];
      for (const productDoc of productsSnapshot.docs) {
        const locationsRef = collection(db, 'companies', company.id, 'products', productDoc.id, 'stockLocations');
        const locationsQuery = query(locationsRef, where('locationType', '==', 'customer'), where('locationName', '==', client?.name || ''));
        const locationsSnapshot = await getDocs(locationsQuery);

        locationsSnapshot.docs.forEach(locDoc => {
          clientStockLocations.push({
            id: locDoc.id,
            productId: productDoc.id,
            productName: productDoc.data().name,
            productReference: productDoc.data().reference,
            ...locDoc.data()
          });
        });
      }
      setStockLocations(clientStockLocations);

    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'sent': return '#3b82f6';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pt: {
        draft: 'Rascunho',
        sent: 'Enviado',
        approved: 'Aprovado',
        rejected: 'Rejeitado'
      },
      en: {
        draft: 'Draft',
        sent: 'Sent',
        approved: 'Approved',
        rejected: 'Rejected'
      }
    };
    return labels[language]?.[status] || status;
  };

  const calculateQuotationStats = () => {
    const total = quotations.length;
    const approved = quotations.filter(q => q.status === 'approved').length;
    const pending = quotations.filter(q => q.status === 'sent').length;
    const totalValue = quotations
      .filter(q => q.status === 'approved')
      .reduce((sum, q) => sum + (q.total || 0), 0);

    return { total, approved, pending, totalValue };
  };

  const stats = calculateQuotationStats();

  if (loading) {
    return (
      <div className="client-detail-container">
        <div className="loading-state">{t('loading')}</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="client-detail-container">
        <div className="error-state">
          {language === 'pt' ? 'Cliente não encontrado' : 'Client not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="client-detail-container">
      {/* Header */}
      <div className="client-detail-header">
        <button className="back-button" onClick={() => navigate('/clients')}>
          <ArrowLeftIcon className="icon-sm" />
          {language === 'pt' ? 'Voltar' : 'Back'}
        </button>

        <div className="client-header-info">
          <div className="client-avatar">
            <UserIcon className="icon-lg" />
          </div>
          <div>
            <h1 className="client-name">{client.name}</h1>
            <div className="client-meta">
              {client.nif && (
                <span className="meta-item">
                  {language === 'pt' ? 'NIF' : 'Tax ID'}: {client.nif}
                </span>
              )}
              <span className="meta-item">
                <ClockIcon className="icon-xs" />
                {language === 'pt' ? 'Cliente desde' : 'Client since'} {formatDate(client.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="client-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <DocumentTextIcon style={{ color: '#8b5cf6' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{language === 'pt' ? 'Orçamentos' : 'Quotations'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <DocumentTextIcon style={{ color: '#10b981' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">{language === 'pt' ? 'Aprovados' : 'Approved'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <DocumentTextIcon style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">{language === 'pt' ? 'Pendentes' : 'Pending'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <CubeIcon style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stockLocations.length}</div>
            <div className="stat-label">{language === 'pt' ? 'Produtos no Cliente' : 'Products at Client'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="client-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {language === 'pt' ? 'Visão Geral' : 'Overview'}
        </button>
        <button
          className={`tab ${activeTab === 'quotations' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotations')}
        >
          {language === 'pt' ? 'Orçamentos' : 'Quotations'}
          <span className="tab-badge">{quotations.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          {language === 'pt' ? 'Stock no Cliente' : 'Stock at Client'}
          <span className="tab-badge">{stockLocations.length}</span>
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
                {client.email && (
                  <div className="info-item">
                    <EnvelopeIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{t('email')}</div>
                      <div className="info-value">{client.email}</div>
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div className="info-item">
                    <PhoneIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{language === 'pt' ? 'Telefone' : 'Phone'}</div>
                      <div className="info-value">{client.phone}</div>
                    </div>
                  </div>
                )}
                {client.address && (
                  <div className="info-item">
                    <MapPinIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{language === 'pt' ? 'Morada' : 'Address'}</div>
                      <div className="info-value">
                        {typeof client.address === 'string'
                          ? client.address
                          : [
                              client.address.street,
                              client.address.city,
                              client.address.postalCode,
                              client.address.country
                            ].filter(Boolean).join(', ')
                        }
                      </div>
                    </div>
                  </div>
                )}
                {client.nif && (
                  <div className="info-item">
                    <BuildingOfficeIcon className="icon-sm" />
                    <div>
                      <div className="info-label">{language === 'pt' ? 'NIF' : 'Tax ID'}</div>
                      <div className="info-value">{client.nif}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="info-card">
              <h3 className="card-title">{language === 'pt' ? 'Resumo de Atividade' : 'Activity Summary'}</h3>
              <div className="activity-summary">
                <div className="summary-item">
                  <div className="summary-label">{language === 'pt' ? 'Total de Orçamentos' : 'Total Quotations'}</div>
                  <div className="summary-value">{stats.total}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">{language === 'pt' ? 'Valor Aprovado' : 'Approved Value'}</div>
                  <div className="summary-value">{stats.totalValue.toFixed(2)}€</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">{language === 'pt' ? 'Taxa de Aprovação' : 'Approval Rate'}</div>
                  <div className="summary-value">
                    {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === 'quotations' && (
          <div className="quotations-content">
            {quotations.length === 0 ? (
              <div className="empty-state">
                <DocumentTextIcon className="empty-icon" />
                <p>{language === 'pt' ? 'Nenhum orçamento encontrado' : 'No quotations found'}</p>
              </div>
            ) : (
              <div className="quotations-list">
                {quotations.map(quotation => (
                  <div key={quotation.id} className="quotation-card">
                    <div className="quotation-header">
                      <div>
                        <h4 className="quotation-number">
                          {language === 'pt' ? 'Orçamento' : 'Quotation'} #{quotation.number || quotation.id.slice(0, 8)}
                        </h4>
                        <p className="quotation-date">{formatDate(quotation.createdAt)}</p>
                      </div>
                      <div
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(quotation.status) }}
                      >
                        {getStatusLabel(quotation.status)}
                      </div>
                    </div>
                    <div className="quotation-details">
                      <div className="detail-item">
                        <span className="detail-label">{language === 'pt' ? 'Produtos' : 'Products'}:</span>
                        <span className="detail-value">{quotation.items?.length || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">{language === 'pt' ? 'Total' : 'Total'}:</span>
                        <span className="detail-value">{quotation.total?.toFixed(2) || '0.00'}€</span>
                      </div>
                    </div>
                    <button
                      className="view-quotation-btn"
                      onClick={() => navigate(`/quotations/${quotation.id}`)}
                    >
                      {t('view')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className="stock-content">
            {stockLocations.length === 0 ? (
              <div className="empty-state">
                <CubeIcon className="empty-icon" />
                <p>{language === 'pt' ? 'Nenhum produto no cliente' : 'No products at client'}</p>
              </div>
            ) : (
              <div className="stock-table">
                <table>
                  <thead>
                    <tr>
                      <th>{language === 'pt' ? 'Referência' : 'Reference'}</th>
                      <th>{language === 'pt' ? 'Produto' : 'Product'}</th>
                      <th>{language === 'pt' ? 'Quantidade' : 'Quantity'}</th>
                      <th>{language === 'pt' ? 'Localização' : 'Location'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockLocations.map(location => (
                      <tr key={location.id}>
                        <td>{location.productReference}</td>
                        <td>{location.productName}</td>
                        <td>{location.quantity}</td>
                        <td>{location.locationName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
        {activeTab === 'emails' && client && (
          <EmailsTab contact={{ ...client, id: clientId, type: 'client' }} />
        )}
      </div>
    </div>
  );
};

export default ClientDetail;
