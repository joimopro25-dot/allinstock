import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { quotationService } from '../../services/quotationService';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { Sidebar } from '../../components/common/Sidebar';
import { AddQuotationModal } from '../../components/quotations/AddQuotationModal';
import { ViewQuotationModal } from '../../components/quotations/ViewQuotationModal';
import { EditQuotationModal } from '../../components/quotations/EditQuotationModal';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import './Quotations.css';

export function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, quotation: null });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState({ show: false, quotation: null });
  const [editModal, setEditModal] = useState({ show: false, quotation: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    loadQuotations();
  }, [company]);

  const loadQuotations = async () => {
    if (!company) return;

    try {
      setLoading(true);
      const data = await quotationService.getQuotations(company.id);
      setQuotations(data);
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.quotation) return;

    try {
      await quotationService.deleteQuotation(company.id, deleteModal.quotation.id);
      await loadQuotations();
      setDeleteModal({ show: false, quotation: null });
    } catch (err) {
      console.error('Failed to delete quotation:', err);
    }
  };

  const handleStatusChange = async (quotationId, newStatus) => {
    try {
      await quotationService.updateQuotationStatus(company.id, quotationId, newStatus);
      await loadQuotations();
    } catch (err) {
      console.error('Failed to update quotation status:', err);
    }
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = search === '' ||
      quotation.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      quotation.clientName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft': return 'draft';
      case 'sent': return 'sent';
      case 'accepted': return 'accepted';
      case 'rejected': return 'rejected';
      case 'expired': return 'expired';
      default: return 'draft';
    }
  };

  const getStatusLabel = (status) => {
    if (language === 'pt') {
      switch (status) {
        case 'draft': return 'Rascunho';
        case 'sent': return 'Enviado';
        case 'accepted': return 'Aceite';
        case 'rejected': return 'Rejeitado';
        case 'expired': return 'Expirado';
        default: return status;
      }
    } else {
      switch (status) {
        case 'draft': return 'Draft';
        case 'sent': return 'Sent';
        case 'accepted': return 'Accepted';
        case 'rejected': return 'Rejected';
        case 'expired': return 'Expired';
        default: return status;
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className={`quotations-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="quotations-header">
          <div className="header-left">
            <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              AllInStock
            </h1>
            <h2 className="page-title">{language === 'pt' ? 'Orçamentos' : 'Quotations'}</h2>
          </div>

          <div className="header-right">
            <LanguageToggle />
            <button className="logout-button" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="quotations-content">
          <div className="toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder={language === 'pt' ? 'Pesquisar orçamentos...' : 'Search quotations...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">{language === 'pt' ? 'Todos os Estados' : 'All Statuses'}</option>
              <option value="draft">{language === 'pt' ? 'Rascunho' : 'Draft'}</option>
              <option value="sent">{language === 'pt' ? 'Enviado' : 'Sent'}</option>
              <option value="accepted">{language === 'pt' ? 'Aceite' : 'Accepted'}</option>
              <option value="rejected">{language === 'pt' ? 'Rejeitado' : 'Rejected'}</option>
              <option value="expired">{language === 'pt' ? 'Expirado' : 'Expired'}</option>
            </select>

            <button
              className="add-button"
              onClick={() => setAddModalOpen(true)}
            >
              {language === 'pt' ? 'Criar Orçamento' : 'Create Quotation'}
            </button>
          </div>

          {loading ? (
            <div className="loading">{t('loading')}</div>
          ) : filteredQuotations.length === 0 ? (
            <div className="empty-state">
              <DocumentTextIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhum orçamento encontrado' : 'No quotations found'}</p>
              {search === '' && statusFilter === 'all' && (
                <button className="add-button" onClick={() => setAddModalOpen(true)}>
                  {language === 'pt' ? 'Criar Primeiro Orçamento' : 'Create First Quotation'}
                </button>
              )}
            </div>
          ) : (
            <div className="quotations-grid">
              {filteredQuotations.map(quotation => (
                <div key={quotation.id} className="quotation-card">
                  <div className="quotation-card-header">
                    <div className="quotation-number-section">
                      <DocumentTextIcon className="quotation-icon" />
                      <div>
                        <h3 className="quotation-number">{quotation.quotationNumber}</h3>
                        <p className="quotation-client">{quotation.clientName}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(quotation.status)}`}>
                      {getStatusLabel(quotation.status)}
                    </span>
                  </div>

                  <div className="quotation-details">
                    <div className="detail-row">
                      <span className="detail-label">{language === 'pt' ? 'Total' : 'Total'}:</span>
                      <span className="detail-value total">€{quotation.total?.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{language === 'pt' ? 'Itens' : 'Items'}:</span>
                      <span className="detail-value">{quotation.items?.length || 0}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{language === 'pt' ? 'Criado em' : 'Created'}:</span>
                      <span className="detail-value">{formatDate(quotation.createdAt)}</span>
                    </div>
                    {quotation.validUntil && (
                      <div className="detail-row">
                        <span className="detail-label">{language === 'pt' ? 'Válido até' : 'Valid until'}:</span>
                        <span className="detail-value">{formatDate(quotation.validUntil)}</span>
                      </div>
                    )}
                  </div>

                  <div className="quotation-actions">
                    <button
                      className="action-button view"
                      onClick={() => setViewModal({ show: true, quotation })}
                      title={language === 'pt' ? 'Ver' : 'View'}
                    >
                      <EyeIcon className="action-icon" />
                    </button>
                    {quotation.status === 'draft' && (
                      <>
                        <button
                          className="action-button edit"
                          onClick={() => setEditModal({ show: true, quotation })}
                          title={language === 'pt' ? 'Editar' : 'Edit'}
                        >
                          <PencilIcon className="action-icon" />
                        </button>
                        <button
                          className="action-button send"
                          onClick={() => handleStatusChange(quotation.id, 'sent')}
                          title={language === 'pt' ? 'Enviar' : 'Send'}
                        >
                          <PaperAirplaneIcon className="action-icon" />
                        </button>
                      </>
                    )}
                    {quotation.status === 'sent' && (
                      <>
                        <button
                          className="action-button accept"
                          onClick={() => handleStatusChange(quotation.id, 'accepted')}
                          title={language === 'pt' ? 'Aceitar' : 'Accept'}
                        >
                          <CheckCircleIcon className="action-icon" />
                        </button>
                        <button
                          className="action-button reject"
                          onClick={() => handleStatusChange(quotation.id, 'rejected')}
                          title={language === 'pt' ? 'Rejeitar' : 'Reject'}
                        >
                          <XCircleIcon className="action-icon" />
                        </button>
                      </>
                    )}
                    <button
                      className="action-button delete"
                      onClick={() => setDeleteModal({ show: true, quotation })}
                      title={language === 'pt' ? 'Eliminar' : 'Delete'}
                    >
                      <TrashIcon className="action-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AddQuotationModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={loadQuotations}
        />

        <ViewQuotationModal
          isOpen={viewModal.show}
          onClose={() => setViewModal({ show: false, quotation: null })}
          quotation={viewModal.quotation}
        />

        <EditQuotationModal
          isOpen={editModal.show}
          onClose={() => setEditModal({ show: false, quotation: null })}
          onSuccess={loadQuotations}
          quotation={editModal.quotation}
        />

        {deleteModal.show && (
          <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, quotation: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">
                {language === 'pt' ? 'Eliminar Orçamento' : 'Delete Quotation'}
              </h3>
              <p className="modal-text">
                {language === 'pt'
                  ? `Tem certeza que deseja eliminar o orçamento "${deleteModal.quotation?.quotationNumber}"?`
                  : `Are you sure you want to delete quotation "${deleteModal.quotation?.quotationNumber}"?`
                }
              </p>
              <p className="modal-warning">
                {language === 'pt'
                  ? 'Esta ação não pode ser desfeita.'
                  : 'This action cannot be undone.'
                }
              </p>
              <div className="modal-actions">
                <button
                  className="modal-button cancel"
                  onClick={() => setDeleteModal({ show: false, quotation: null })}
                >
                  {t('cancel')}
                </button>
                <button
                  className="modal-button confirm"
                  onClick={handleDelete}
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
