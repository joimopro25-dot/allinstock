import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { invoiceService } from '../../services/invoiceService';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { Sidebar } from '../../components/common/Sidebar';
import {
  DocumentTextIcon,
  EyeIcon,
  BanknotesIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './Invoices.css';

export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, invoice: null });
  const [paymentModal, setPaymentModal] = useState({ show: false, invoice: null });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    loadInvoices();
  }, [company]);

  const loadInvoices = async () => {
    if (!company) return;

    try {
      setLoading(true);
      const data = await invoiceService.getInvoices(company.id);
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.invoice) return;

    try {
      await invoiceService.deleteInvoice(company.id, deleteModal.invoice.id);
      await loadInvoices();
      setDeleteModal({ show: false, invoice: null });
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentModal.invoice || !paymentAmount) return;

    try {
      await invoiceService.recordPayment(
        company.id,
        paymentModal.invoice.id,
        parseFloat(paymentAmount),
        paymentMethod,
        new Date().toISOString()
      );
      await loadInvoices();
      setPaymentModal({ show: false, invoice: null });
      setPaymentAmount('');
      setPaymentMethod('cash');
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = search === '' ||
      invoice.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.clientName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || invoice.paymentStatus === paymentStatusFilter;

    // Date range filter
    const invoiceDate = invoice.date ? new Date(invoice.date) : null;
    const matchesStartDate = !startDate || !invoiceDate || invoiceDate >= new Date(startDate);
    const matchesEndDate = !endDate || !invoiceDate || invoiceDate <= new Date(endDate);

    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesStartDate && matchesEndDate;
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    paymentStatusFilter !== 'all',
    startDate !== '',
    endDate !== ''
  ].filter(Boolean).length;

  const getPaymentStatusBadgeClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'paid';
      case 'unpaid': return 'unpaid';
      case 'partially_paid': return 'partially-paid';
      case 'overdue': return 'overdue';
      default: return 'unpaid';
    }
  };

  const getPaymentStatusLabel = (paymentStatus) => {
    if (language === 'pt') {
      switch (paymentStatus) {
        case 'paid': return 'Pago';
        case 'unpaid': return 'Não Pago';
        case 'partially_paid': return 'Parcialmente Pago';
        case 'overdue': return 'Atrasado';
        default: return 'Não Pago';
      }
    } else {
      switch (paymentStatus) {
        case 'paid': return 'Paid';
        case 'unpaid': return 'Unpaid';
        case 'partially_paid': return 'Partially Paid';
        case 'overdue': return 'Overdue';
        default: return 'Unpaid';
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
      <div className={`invoices-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="invoices-header">
          <div className="header-left">
            <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              AllInStock
            </h1>
            <h2 className="page-title">{language === 'pt' ? 'Faturas' : 'Invoices'}</h2>
          </div>

          <div className="header-right">
            <LanguageToggle />
            <button className="logout-button" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="invoices-content">
          <div className="toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder={language === 'pt' ? 'Pesquisar faturas...' : 'Search invoices...'}
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
              onClick={() => navigate('/quotations')}
            >
              {language === 'pt' ? 'Ver Orçamentos' : 'View Quotations'}
            </button>
          </div>

          {showFilters && (
            <div className="advanced-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>{language === 'pt' ? 'Estado de Pagamento' : 'Payment Status'}</label>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">{language === 'pt' ? 'Todos' : 'All'}</option>
                    <option value="paid">{language === 'pt' ? 'Pago' : 'Paid'}</option>
                    <option value="unpaid">{language === 'pt' ? 'Não Pago' : 'Unpaid'}</option>
                    <option value="partially_paid">{language === 'pt' ? 'Parcialmente Pago' : 'Partially Paid'}</option>
                    <option value="overdue">{language === 'pt' ? 'Atrasado' : 'Overdue'}</option>
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
          ) : filteredInvoices.length === 0 ? (
            <div className="empty-state">
              <DocumentTextIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhuma fatura encontrada' : 'No invoices found'}</p>
              <p className="empty-subtitle">
                {language === 'pt' ? 'Crie faturas a partir de orçamentos aprovados' : 'Create invoices from approved quotations'}
              </p>
            </div>
          ) : (
            <div className="invoices-grid">
              {filteredInvoices.map(invoice => (
                <div
                  key={invoice.id}
                  className="invoice-card"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="invoice-card-header">
                    <div>
                      <h3 className="invoice-number">{invoice.invoiceNumber}</h3>
                      <p className="invoice-client">{invoice.clientName}</p>
                    </div>
                    <span className={`payment-badge ${getPaymentStatusBadgeClass(invoice.paymentStatus)}`}>
                      {getPaymentStatusLabel(invoice.paymentStatus)}
                    </span>
                  </div>

                  <div className="invoice-details">
                    <div className="detail-row">
                      <span className="detail-label">{language === 'pt' ? 'Data' : 'Date'}:</span>
                      <span className="detail-value">{invoice.date}</span>
                    </div>
                    {invoice.dueDate && (
                      <div className="detail-row">
                        <span className="detail-label">{language === 'pt' ? 'Vencimento' : 'Due Date'}:</span>
                        <span className="detail-value">{invoice.dueDate}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">{language === 'pt' ? 'Total' : 'Total'}:</span>
                      <span className="detail-value total">€{invoice.total?.toFixed(2)}</span>
                    </div>
                    {invoice.paymentStatus === 'partially_paid' && (
                      <div className="detail-row">
                        <span className="detail-label">{language === 'pt' ? 'Pago' : 'Paid'}:</span>
                        <span className="detail-value">€{invoice.paidAmount?.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="invoice-actions">
                    <button
                      className="action-button view"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/invoices/${invoice.id}`);
                      }}
                    >
                      <EyeIcon style={{ width: '18px', height: '18px' }} />
                      {language === 'pt' ? 'Ver' : 'View'}
                    </button>
                    {invoice.paymentStatus !== 'paid' && (
                      <button
                        className="action-button payment"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentModal({ show: true, invoice });
                        }}
                      >
                        <BanknotesIcon style={{ width: '18px', height: '18px' }} />
                        {language === 'pt' ? 'Pagar' : 'Pay'}
                      </button>
                    )}
                    <button
                      className="action-button delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ show: true, invoice });
                      }}
                    >
                      <TrashIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {paymentModal.show && (
          <div className="modal-overlay" onClick={() => setPaymentModal({ show: false, invoice: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">
                {language === 'pt' ? 'Registar Pagamento' : 'Record Payment'}
              </h3>
              <p className="modal-text">
                {language === 'pt' ? 'Fatura' : 'Invoice'}: {paymentModal.invoice?.invoiceNumber}
              </p>
              <p className="modal-text">
                {language === 'pt' ? 'Total' : 'Total'}: €{paymentModal.invoice?.total?.toFixed(2)}
              </p>
              {paymentModal.invoice?.paidAmount > 0 && (
                <p className="modal-text">
                  {language === 'pt' ? 'Já Pago' : 'Already Paid'}: €{paymentModal.invoice?.paidAmount?.toFixed(2)}
                </p>
              )}

              <input
                type="number"
                placeholder={language === 'pt' ? 'Valor do pagamento' : 'Payment amount'}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="modal-input"
                step="0.01"
                min="0"
                max={paymentModal.invoice?.total - (paymentModal.invoice?.paidAmount || 0)}
              />

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="modal-select"
              >
                <option value="cash">{language === 'pt' ? 'Dinheiro' : 'Cash'}</option>
                <option value="card">{language === 'pt' ? 'Cartão' : 'Card'}</option>
                <option value="transfer">{language === 'pt' ? 'Transferência' : 'Transfer'}</option>
                <option value="check">{language === 'pt' ? 'Cheque' : 'Check'}</option>
              </select>

              <div className="modal-actions">
                <button
                  className="modal-button cancel"
                  onClick={() => setPaymentModal({ show: false, invoice: null })}
                >
                  {t('cancel')}
                </button>
                <button
                  className="modal-button confirm"
                  onClick={handleRecordPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  {language === 'pt' ? 'Registar' : 'Record'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModal.show && (
          <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, invoice: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">{language === 'pt' ? 'Eliminar Fatura' : 'Delete Invoice'}</h3>
              <p className="modal-text">
                {language === 'pt'
                  ? 'Tem certeza que deseja eliminar esta fatura?'
                  : 'Are you sure you want to delete this invoice?'}
              </p>
              <div className="modal-actions">
                <button
                  className="modal-button cancel"
                  onClick={() => setDeleteModal({ show: false, invoice: null })}
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
