import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { invoiceService } from '../../services/invoiceService';
import {
  ArrowLeftIcon,
  PrinterIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  DocumentArrowDownIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import '../../styles/QuotationDetail.css';

const QuotationDetail = () => {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const { language } = useLanguage();
  const [quotation, setQuotation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuotation, setEditedQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    if (company?.id && quotationId) {
      loadQuotationData();
    }
  }, [company?.id, quotationId]);

  const loadQuotationData = async () => {
    try {
      setLoading(true);
      const quotationDoc = await getDoc(doc(db, 'companies', company.id, 'quotations', quotationId));

      if (quotationDoc.exists()) {
        const data = { id: quotationDoc.id, ...quotationDoc.data() };
        setQuotation(data);
        setEditedQuotation(data);
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const quotationRef = doc(db, 'companies', company.id, 'quotations', quotationId);

      await updateDoc(quotationRef, {
        ...editedQuotation,
        updatedAt: new Date().toISOString()
      });

      setQuotation(editedQuotation);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert(language === 'pt' ? 'Erro ao guardar orçamento' : 'Error saving quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const quotationRef = doc(db, 'companies', company.id, 'quotations', quotationId);

      await updateDoc(quotationRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setQuotation({ ...quotation, status: newStatus });
      setEditedQuotation({ ...editedQuotation, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const confirmed = confirm(
        language === 'pt'
          ? 'Criar fatura a partir deste orçamento?'
          : 'Create invoice from this quotation?'
      );

      if (!confirmed) return;

      const invoiceId = await invoiceService.createInvoiceFromQuotation(
        company.id,
        quotationId,
        quotation
      );

      alert(
        language === 'pt'
          ? 'Fatura criada com sucesso!'
          : 'Invoice created successfully!'
      );

      navigate(`/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(
        language === 'pt'
          ? 'Erro ao criar fatura'
          : 'Error creating invoice'
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export using jsPDF or similar library
    alert(language === 'pt' ? 'Funcionalidade de exportar PDF em desenvolvimento' : 'PDF export feature coming soon');
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
      case 'expired': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pt: {
        draft: 'Rascunho',
        sent: 'Enviado',
        approved: 'Aprovado',
        rejected: 'Rejeitado',
        expired: 'Expirado'
      },
      en: {
        draft: 'Draft',
        sent: 'Sent',
        approved: 'Approved',
        rejected: 'Rejected',
        expired: 'Expired'
      }
    };
    return labels[language]?.[status] || status;
  };

  const calculateSubtotal = () => {
    if (!quotation?.items) return 0;
    return quotation.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = quotation?.taxRate || 0;
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  if (loading) {
    return (
      <div className="quotation-detail-container">
        <div className="loading-state">{t('loading')}</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="quotation-detail-container">
        <div className="error-state">
          {language === 'pt' ? 'Orçamento não encontrado' : 'Quotation not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="quotation-detail-container">
      {/* Header - Hide on print */}
      <div className="quotation-header no-print">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/quotations')}>
            <ArrowLeftIcon className="icon-sm" />
            {language === 'pt' ? 'Voltar' : 'Back'}
          </button>

          <div className="header-title">
            <h1>{language === 'pt' ? 'Orçamento' : 'Quotation'} #{quotation.number || quotation.id.slice(0, 8)}</h1>
            <div
              className="status-badge"
              style={{ backgroundColor: getStatusColor(quotation.status) }}
            >
              {getStatusLabel(quotation.status)}
            </div>
          </div>
        </div>

        <div className="header-actions">
          {!isEditing ? (
            <>
              <button className="action-btn" onClick={() => setIsEditing(true)}>
                <PencilIcon className="icon-sm" />
                {language === 'pt' ? 'Editar' : 'Edit'}
              </button>
              <button className="action-btn" onClick={handlePrint}>
                <PrinterIcon className="icon-sm" />
                {language === 'pt' ? 'Imprimir' : 'Print'}
              </button>
              <button className="action-btn primary" onClick={handleExportPDF}>
                <DocumentArrowDownIcon className="icon-sm" />
                PDF
              </button>
            </>
          ) : (
            <>
              <button className="action-btn" onClick={() => { setIsEditing(false); setEditedQuotation(quotation); }}>
                {language === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
              <button className="action-btn primary" onClick={handleSave} disabled={saving}>
                {saving ? (language === 'pt' ? 'A guardar...' : 'Saving...') : (language === 'pt' ? 'Guardar' : 'Save')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Actions - Hide on print */}
      {quotation.status === 'draft' && !isEditing && (
        <div className="status-actions no-print">
          <button className="status-action-btn send" onClick={() => handleStatusChange('sent')}>
            <PaperAirplaneIcon className="icon-sm" />
            {language === 'pt' ? 'Marcar como Enviado' : 'Mark as Sent'}
          </button>
        </div>
      )}

      {quotation.status === 'sent' && !isEditing && (
        <div className="status-actions no-print">
          <button className="status-action-btn approve" onClick={() => handleStatusChange('approved')}>
            <CheckCircleIcon className="icon-sm" />
            {language === 'pt' ? 'Marcar como Aprovado' : 'Mark as Approved'}
          </button>
          <button className="status-action-btn reject" onClick={() => handleStatusChange('rejected')}>
            <XCircleIcon className="icon-sm" />
            {language === 'pt' ? 'Marcar como Rejeitado' : 'Mark as Rejected'}
          </button>
        </div>
      )}

      {quotation.status === 'approved' && !isEditing && (
        <div className="status-actions no-print">
          <button className="status-action-btn invoice" onClick={handleCreateInvoice}>
            <BanknotesIcon className="icon-sm" />
            {language === 'pt' ? 'Criar Fatura' : 'Create Invoice'}
          </button>
        </div>
      )}

      {/* Quotation Document */}
      <div className="quotation-document">
        {/* Company Header */}
        <div className="document-header">
          <div className="company-info">
            <h2>{company.name}</h2>
            {company.address && <p>{company.address}</p>}
            {company.phone && <p>{language === 'pt' ? 'Tel:' : 'Phone:'} {company.phone}</p>}
            {company.email && <p>{language === 'pt' ? 'Email:' : 'Email:'} {company.email}</p>}
          </div>
          <div className="document-info">
            <h3>{language === 'pt' ? 'ORÇAMENTO' : 'QUOTATION'}</h3>
            <p><strong>#{quotation.number || quotation.id.slice(0, 8)}</strong></p>
            <p>{formatDate(quotation.createdAt)}</p>
          </div>
        </div>

        {/* Client Info */}
        <div className="client-section">
          <h4>{language === 'pt' ? 'Cliente:' : 'Client:'}</h4>
          {isEditing ? (
            <input
              type="text"
              value={editedQuotation.clientName || ''}
              onChange={(e) => setEditedQuotation({ ...editedQuotation, clientName: e.target.value })}
              className="edit-input"
            />
          ) : (
            <p><strong>{quotation.clientName}</strong></p>
          )}
          {quotation.clientEmail && <p>{quotation.clientEmail}</p>}
          {quotation.clientPhone && <p>{quotation.clientPhone}</p>}
        </div>

        {/* Items Table */}
        <div className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th>{language === 'pt' ? 'Descrição' : 'Description'}</th>
                <th>{language === 'pt' ? 'Quantidade' : 'Quantity'}</th>
                <th>{language === 'pt' ? 'Preço Unit.' : 'Unit Price'}</th>
                <th>{language === 'pt' ? 'Total' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{item.price.toFixed(2)}€</td>
                  <td>{(item.quantity * item.price).toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="totals-section">
          <div className="totals-row">
            <span>{language === 'pt' ? 'Subtotal:' : 'Subtotal:'}</span>
            <span>{calculateSubtotal().toFixed(2)}€</span>
          </div>
          {quotation.taxRate > 0 && (
            <div className="totals-row">
              <span>{language === 'pt' ? 'IVA' : 'Tax'} ({quotation.taxRate}%):</span>
              <span>{calculateTax().toFixed(2)}€</span>
            </div>
          )}
          <div className="totals-row total">
            <span><strong>{language === 'pt' ? 'Total:' : 'Total:'}</strong></span>
            <span><strong>{calculateTotal().toFixed(2)}€</strong></span>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="notes-section">
            <h4>{language === 'pt' ? 'Notas:' : 'Notes:'}</h4>
            {isEditing ? (
              <textarea
                value={editedQuotation.notes || ''}
                onChange={(e) => setEditedQuotation({ ...editedQuotation, notes: e.target.value })}
                className="edit-textarea"
                rows={4}
              />
            ) : (
              <p>{quotation.notes}</p>
            )}
          </div>
        )}

        {/* Validity */}
        {quotation.validUntil && (
          <div className="validity-section">
            <p>
              {language === 'pt' ? 'Válido até:' : 'Valid until:'} <strong>{formatDate(quotation.validUntil)}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationDetail;
