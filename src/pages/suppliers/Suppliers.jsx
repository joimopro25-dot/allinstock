import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { supplierService } from '../../services/supplierService';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { Sidebar } from '../../components/common/Sidebar';
import { AddSupplierModal } from '../../components/suppliers/AddSupplierModal';
import { EditSupplierModal } from '../../components/suppliers/EditSupplierModal';
import {
  BuildingStorefrontIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import './Suppliers.css';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, supplier: null });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, supplier: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    loadSuppliers();
  }, [company]);

  const loadSuppliers = async () => {
    if (!company) return;

    try {
      setLoading(true);
      const data = await supplierService.getSuppliers(company.id);
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.supplier) return;

    try {
      await supplierService.deleteSupplier(company.id, deleteModal.supplier.id);
      await loadSuppliers();
      setDeleteModal({ show: false, supplier: null });
    } catch (err) {
      console.error('Failed to delete supplier:', err);
    }
  };

  const handleToggleStatus = async (supplierId) => {
    try {
      await supplierService.toggleSupplierStatus(company.id, supplierId);
      await loadSuppliers();
    } catch (err) {
      console.error('Failed to toggle supplier status:', err);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = search === '' ||
      supplier.name?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.phone?.includes(search) ||
      supplier.taxId?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      <div className={`suppliers-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="suppliers-header">
          <div className="header-left">
            <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              AllInStock
            </h1>
            <h2 className="page-title">{language === 'pt' ? 'Fornecedores' : 'Suppliers'}</h2>
          </div>

          <div className="header-right">
            <LanguageToggle />
            <button className="logout-button" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="suppliers-content">
          <div className="toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder={language === 'pt' ? 'Pesquisar fornecedores...' : 'Search suppliers...'}
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
              <option value="active">{language === 'pt' ? 'Ativos' : 'Active'}</option>
              <option value="inactive">{language === 'pt' ? 'Inativos' : 'Inactive'}</option>
            </select>

            <button
              className="add-button"
              onClick={() => setAddModalOpen(true)}
            >
              {language === 'pt' ? 'Adicionar Fornecedor' : 'Add Supplier'}
            </button>
          </div>

          {loading ? (
            <div className="loading">{t('loading')}</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="empty-state">
              <BuildingStorefrontIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhum fornecedor encontrado' : 'No suppliers found'}</p>
              {search === '' && statusFilter === 'all' && (
                <button className="add-button" onClick={() => setAddModalOpen(true)}>
                  {language === 'pt' ? 'Adicionar Primeiro Fornecedor' : 'Add First Supplier'}
                </button>
              )}
            </div>
          ) : (
            <div className="suppliers-grid">
              {filteredSuppliers.map(supplier => (
                <div key={supplier.id} className="supplier-card">
                  <div className="supplier-card-header">
                    <div className="supplier-avatar">
                      <BuildingStorefrontIcon className="avatar-icon" />
                    </div>
                    <div className="supplier-title">
                      <h3 className="supplier-name">{supplier.companyName}</h3>
                      {supplier.name && (
                        <p className="supplier-contact">{supplier.name}</p>
                      )}
                    </div>
                    <span className={`status-badge ${supplier.status}`}>
                      {supplier.status === 'active'
                        ? (language === 'pt' ? 'Ativo' : 'Active')
                        : (language === 'pt' ? 'Inativo' : 'Inactive')
                      }
                    </span>
                  </div>

                  <div className="supplier-details">
                    {supplier.email && (
                      <div className="detail-row">
                        <EnvelopeIcon className="detail-icon" />
                        <span className="detail-value">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="detail-row">
                        <PhoneIcon className="detail-icon" />
                        <span className="detail-value">{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.taxId && (
                      <div className="detail-row">
                        <IdentificationIcon className="detail-icon" />
                        <span className="detail-value">{supplier.taxId}</span>
                      </div>
                    )}
                    {supplier.address?.city && (
                      <div className="detail-row">
                        <MapPinIcon className="detail-icon" />
                        <span className="detail-value">
                          {supplier.address.city}{supplier.address.country && `, ${supplier.address.country}`}
                        </span>
                      </div>
                    )}
                    {supplier.paymentTerms && (
                      <div className="detail-row">
                        <BanknotesIcon className="detail-icon" />
                        <span className="detail-value">
                          {language === 'pt' ? 'Pagamento: ' : 'Payment: '}{supplier.paymentTerms}
                        </span>
                      </div>
                    )}
                    {supplier.deliveryTime && (
                      <div className="detail-row">
                        <ClockIcon className="detail-icon" />
                        <span className="detail-value">
                          {language === 'pt' ? 'Entrega: ' : 'Delivery: '}{supplier.deliveryTime}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="supplier-actions">
                    <button
                      className={`action-button toggle ${supplier.status === 'active' ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleStatus(supplier.id)}
                    >
                      {supplier.status === 'active'
                        ? (language === 'pt' ? 'Desativar' : 'Deactivate')
                        : (language === 'pt' ? 'Ativar' : 'Activate')
                      }
                    </button>
                    <button
                      className="action-button edit"
                      onClick={() => setEditModal({ show: true, supplier })}
                    >
                      {t('edit')}
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => setDeleteModal({ show: true, supplier })}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AddSupplierModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={loadSuppliers}
        />

        <EditSupplierModal
          isOpen={editModal.show}
          onClose={() => setEditModal({ show: false, supplier: null })}
          onSuccess={loadSuppliers}
          supplier={editModal.supplier}
        />

        {deleteModal.show && (
          <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, supplier: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">
                {language === 'pt' ? 'Eliminar Fornecedor' : 'Delete Supplier'}
              </h3>
              <p className="modal-text">
                {language === 'pt'
                  ? `Tem certeza que deseja eliminar o fornecedor "${deleteModal.supplier?.companyName}"?`
                  : `Are you sure you want to delete the supplier "${deleteModal.supplier?.companyName}"?`
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
                  onClick={() => setDeleteModal({ show: false, supplier: null })}
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
