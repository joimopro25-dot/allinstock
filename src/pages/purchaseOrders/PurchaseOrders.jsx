import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { Sidebar } from '../../components/common/Sidebar';
import { AddPurchaseOrderModal } from '../../components/purchaseOrders/AddPurchaseOrderModal';
import { PriceUpdateConfirmModal } from '../../components/purchaseOrders/PriceUpdateConfirmModal';
import {
  ShoppingCartIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import './PurchaseOrders.css';

export function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ show: false, po: null });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [priceConfirmModal, setPriceConfirmModal] = useState({
    show: false,
    poId: null,
    priceChanges: []
  });

  const { company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    if (company?.id) {
      loadPurchaseOrders();
      loadSuppliers();
    }
  }, [company]);

  const loadPurchaseOrders = async () => {
    if (!company) return;

    try {
      setLoading(true);
      const data = await purchaseOrderService.getPurchaseOrders(company.id);
      setPurchaseOrders(data);
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const suppliersSnapshot = await getDocs(collection(db, 'companies', company.id, 'suppliers'));
      setSuppliers(suppliersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.po) return;

    try {
      await purchaseOrderService.deletePurchaseOrder(company.id, deleteModal.po.id);
      await loadPurchaseOrders();
      setDeleteModal({ show: false, po: null });
    } catch (err) {
      console.error('Failed to delete purchase order:', err);
    }
  };

  const handleReceive = async (poId) => {
    try {
      // First check if there are any price changes
      const priceChanges = await purchaseOrderService.checkPriceChanges(company.id, poId);

      if (priceChanges.length > 0) {
        // Show price confirmation modal
        setPriceConfirmModal({
          show: true,
          poId,
          priceChanges
        });
      } else {
        // No price changes, proceed directly
        const confirmed = confirm(
          language === 'pt'
            ? 'Marcar esta encomenda como recebida? Isto irá atualizar o stock dos produtos.'
            : 'Mark this order as received? This will update product stock.'
        );

        if (!confirmed) return;

        await purchaseOrderService.receivePurchaseOrder(company.id, poId, false);
        await loadPurchaseOrders();
      }
    } catch (err) {
      console.error('Failed to receive purchase order:', err);
      alert(language === 'pt' ? 'Erro ao receber encomenda' : 'Error receiving order');
    }
  };

  const handleConfirmPriceUpdate = async () => {
    try {
      await purchaseOrderService.receivePurchaseOrder(company.id, priceConfirmModal.poId, true);
      await loadPurchaseOrders();
      setPriceConfirmModal({ show: false, poId: null, priceChanges: [] });
    } catch (err) {
      console.error('Failed to receive purchase order:', err);
      alert(language === 'pt' ? 'Erro ao receber encomenda' : 'Error receiving order');
    }
  };

  const handleSkipPriceUpdate = async () => {
    try {
      await purchaseOrderService.receivePurchaseOrder(company.id, priceConfirmModal.poId, false);
      await loadPurchaseOrders();
      setPriceConfirmModal({ show: false, poId: null, priceChanges: [] });
    } catch (err) {
      console.error('Failed to receive purchase order:', err);
      alert(language === 'pt' ? 'Erro ao receber encomenda' : 'Error receiving order');
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const matchesSearch = search === '' ||
      po.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || po.supplierId === supplierFilter;

    // Date range filter
    const poDate = po.orderDate ? new Date(po.orderDate) : null;
    const matchesStartDate = !startDate || !poDate || poDate >= new Date(startDate);
    const matchesEndDate = !endDate || !poDate || poDate <= new Date(endDate);

    return matchesSearch && matchesStatus && matchesSupplier && matchesStartDate && matchesEndDate;
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setSupplierFilter('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    supplierFilter !== 'all',
    startDate !== '',
    endDate !== ''
  ].filter(Boolean).length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'ordered': return 'ordered';
      case 'received': return 'received';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  };

  const getStatusLabel = (status) => {
    if (language === 'pt') {
      switch (status) {
        case 'pending': return 'Pendente';
        case 'ordered': return 'Encomendado';
        case 'received': return 'Recebido';
        case 'cancelled': return 'Cancelado';
        default: return 'Pendente';
      }
    } else {
      switch (status) {
        case 'pending': return 'Pending';
        case 'ordered': return 'Ordered';
        case 'received': return 'Received';
        case 'cancelled': return 'Cancelled';
        default: return 'Pending';
      }
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

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className={`purchase-orders-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="purchase-orders-header">
          <div className="header-left">
            <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              AllInStock
            </h1>
            <h2 className="page-title">{language === 'pt' ? 'Encomendas a Fornecedores' : 'Purchase Orders'}</h2>
          </div>

          <div className="header-right">
            <LanguageToggle />
            <button className="logout-button" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="purchase-orders-content">
          <div className="toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder={language === 'pt' ? 'Pesquisar encomendas...' : 'Search orders...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <button
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon style={{ width: '18px', height: '18px' }} />
              {language === 'pt' ? 'Filtros' : 'Filters'}
              {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            </button>

            <button
              className="add-button"
              onClick={() => setAddModalOpen(true)}
            >
              <PlusIcon style={{ width: '18px', height: '18px' }} />
              {language === 'pt' ? 'Nova Encomenda' : 'New Order'}
            </button>
          </div>

          {showFilters && (
            <div className="advanced-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>{language === 'pt' ? 'Estado' : 'Status'}</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">{language === 'pt' ? 'Todos' : 'All'}</option>
                    <option value="pending">{language === 'pt' ? 'Pendente' : 'Pending'}</option>
                    <option value="ordered">{language === 'pt' ? 'Encomendado' : 'Ordered'}</option>
                    <option value="received">{language === 'pt' ? 'Recebido' : 'Received'}</option>
                    <option value="cancelled">{language === 'pt' ? 'Cancelado' : 'Cancelled'}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>{language === 'pt' ? 'Fornecedor' : 'Supplier'}</label>
                  <select
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">{language === 'pt' ? 'Todos' : 'All'}</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>{language === 'pt' ? 'Data Início' : 'Start Date'}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label>{language === 'pt' ? 'Data Fim' : 'End Date'}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label>&nbsp;</label>
                  <button
                    className="clear-filters-button"
                    onClick={clearFilters}
                    disabled={activeFilterCount === 0}
                  >
                    <XMarkIcon style={{ width: '18px', height: '18px' }} />
                    {language === 'pt' ? 'Limpar Filtros' : 'Clear Filters'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">{t('loading')}</div>
          ) : filteredPurchaseOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingCartIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhuma encomenda encontrada' : 'No purchase orders found'}</p>
              <button className="add-button" onClick={() => setAddModalOpen(true)}>
                <PlusIcon style={{ width: '18px', height: '18px' }} />
                {language === 'pt' ? 'Criar Primeira Encomenda' : 'Create First Order'}
              </button>
            </div>
          ) : (
            <div className="purchase-orders-grid">
              {filteredPurchaseOrders.map(po => (
                <div key={po.id} className="po-card">
                  <div className="po-card-header">
                    <div>
                      <h3 className="po-number">{po.poNumber}</h3>
                      <p className="po-supplier">{po.supplierName}</p>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(po.status)}`}>
                      {getStatusLabel(po.status)}
                    </span>
                  </div>

                  <div className="po-details">
                    <div className="detail-row">
                      <span className="detail-label">{language === 'pt' ? 'Data' : 'Date'}:</span>
                      <span className="detail-value">{po.orderDate}</span>
                    </div>
                    {po.expectedDate && (
                      <div className="detail-row">
                        <span className="detail-label">{language === 'pt' ? 'Entrega Prevista' : 'Expected'}:</span>
                        <span className="detail-value">{po.expectedDate}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">{language === 'pt' ? 'Itens' : 'Items'}:</span>
                      <span className="detail-value">{po.items?.length || 0}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{language === 'pt' ? 'Total' : 'Total'}:</span>
                      <span className="detail-value total">€{po.total?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="po-actions">
                    {po.status === 'ordered' && (
                      <button
                        className="action-button receive"
                        onClick={() => handleReceive(po.id)}
                      >
                        <CheckCircleIcon style={{ width: '18px', height: '18px' }} />
                        {language === 'pt' ? 'Receber' : 'Receive'}
                      </button>
                    )}
                    <button
                      className="action-button delete"
                      onClick={() => setDeleteModal({ show: true, po })}
                      disabled={po.status === 'received'}
                    >
                      <TrashIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AddPurchaseOrderModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={loadPurchaseOrders}
        />

        {/* Price Update Confirmation Modal */}
        <PriceUpdateConfirmModal
          isOpen={priceConfirmModal.show}
          onClose={() => setPriceConfirmModal({ show: false, poId: null, priceChanges: [] })}
          onConfirm={handleConfirmPriceUpdate}
          onSkip={handleSkipPriceUpdate}
          priceChanges={priceConfirmModal.priceChanges}
          language={language}
        />

        {/* Delete Modal */}
        {deleteModal.show && (
          <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, po: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">{language === 'pt' ? 'Eliminar Encomenda' : 'Delete Purchase Order'}</h3>
              <p className="modal-text">
                {language === 'pt'
                  ? 'Tem certeza que deseja eliminar esta encomenda?'
                  : 'Are you sure you want to delete this purchase order?'}
              </p>
              <div className="modal-actions">
                <button
                  className="modal-button cancel"
                  onClick={() => setDeleteModal({ show: false, po: null })}
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
