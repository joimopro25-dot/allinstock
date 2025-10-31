import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { clientService } from '../../services/clientService';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { Sidebar } from '../../components/common/Sidebar';
import { AddClientModal } from '../../components/clients/AddClientModal';
import { EditClientModal } from '../../components/clients/EditClientModal';
import {
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import './Clients.css';

export function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, client: null });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, client: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    loadClients();
  }, [company]);

  const loadClients = async () => {
    if (!company) return;

    try {
      setLoading(true);
      const data = await clientService.getClients(company.id);
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.client) return;

    try {
      await clientService.deleteClient(company.id, deleteModal.client.id);
      await loadClients();
      setDeleteModal({ show: false, client: null });
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  };

  const handleToggleStatus = async (clientId) => {
    try {
      await clientService.toggleClientStatus(company.id, clientId);
      await loadClients();
    } catch (err) {
      console.error('Failed to toggle client status:', err);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = search === '' ||
      client.name?.toLowerCase().includes(search.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.phone?.includes(search) ||
      client.taxId?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

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
      <div className={`clients-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="clients-header">
          <div className="header-left">
            <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              AllInStock
            </h1>
            <h2 className="page-title">{language === 'pt' ? 'Clientes' : 'Clients'}</h2>
          </div>

          <div className="header-right">
            <LanguageToggle />
            <button className="logout-button" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="clients-content">
          <div className="toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder={language === 'pt' ? 'Pesquisar clientes...' : 'Search clients...'}
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
              {language === 'pt' ? 'Adicionar Cliente' : 'Add Client'}
            </button>
          </div>

          {loading ? (
            <div className="loading">{t('loading')}</div>
          ) : filteredClients.length === 0 ? (
            <div className="empty-state">
              <UserIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhum cliente encontrado' : 'No clients found'}</p>
              {search === '' && statusFilter === 'all' && (
                <button className="add-button" onClick={() => setAddModalOpen(true)}>
                  {language === 'pt' ? 'Adicionar Primeiro Cliente' : 'Add First Client'}
                </button>
              )}
            </div>
          ) : (
            <div className="clients-grid">
              {filteredClients.map(client => (
                <div key={client.id} className="client-card">
                  <div className="client-card-header">
                    <div className="client-avatar">
                      {client.companyName ? (
                        <BuildingOfficeIcon className="avatar-icon" />
                      ) : (
                        <UserIcon className="avatar-icon" />
                      )}
                    </div>
                    <div className="client-title">
                      <h3 className="client-name">{client.name}</h3>
                      {client.companyName && (
                        <p className="client-company">{client.companyName}</p>
                      )}
                    </div>
                    <span className={`status-badge ${client.status}`}>
                      {client.status === 'active'
                        ? (language === 'pt' ? 'Ativo' : 'Active')
                        : (language === 'pt' ? 'Inativo' : 'Inactive')
                      }
                    </span>
                  </div>

                  <div className="client-details">
                    {client.email && (
                      <div className="detail-row">
                        <EnvelopeIcon className="detail-icon" />
                        <span className="detail-value">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="detail-row">
                        <PhoneIcon className="detail-icon" />
                        <span className="detail-value">{client.phone}</span>
                      </div>
                    )}
                    {client.taxId && (
                      <div className="detail-row">
                        <IdentificationIcon className="detail-icon" />
                        <span className="detail-value">{client.taxId}</span>
                      </div>
                    )}
                    {client.address?.city && (
                      <div className="detail-row">
                        <MapPinIcon className="detail-icon" />
                        <span className="detail-value">
                          {client.address.city}{client.address.country && `, ${client.address.country}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="client-actions">
                    <button
                      className={`action-button toggle ${client.status === 'active' ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleStatus(client.id)}
                    >
                      {client.status === 'active'
                        ? (language === 'pt' ? 'Desativar' : 'Deactivate')
                        : (language === 'pt' ? 'Ativar' : 'Activate')
                      }
                    </button>
                    <button
                      className="action-button edit"
                      onClick={() => setEditModal({ show: true, client })}
                    >
                      {t('edit')}
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => setDeleteModal({ show: true, client })}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AddClientModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={loadClients}
        />

        <EditClientModal
          isOpen={editModal.show}
          onClose={() => setEditModal({ show: false, client: null })}
          onSuccess={loadClients}
          client={editModal.client}
        />

        {deleteModal.show && (
          <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, client: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">
                {language === 'pt' ? 'Eliminar Cliente' : 'Delete Client'}
              </h3>
              <p className="modal-text">
                {language === 'pt'
                  ? `Tem certeza que deseja eliminar o cliente "${deleteModal.client?.name}"?`
                  : `Are you sure you want to delete the client "${deleteModal.client?.name}"?`
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
                  onClick={() => setDeleteModal({ show: false, client: null })}
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
