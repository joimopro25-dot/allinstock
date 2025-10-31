import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import '../stock/ProductModal.css';
import './QuotationModal.css';

export function ViewQuotationModal({ isOpen, onClose, quotation }) {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  if (!isOpen || !quotation) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getStatusClass = (status) => {
    switch (status) {
      case 'draft': return 'draft';
      case 'sent': return 'sent';
      case 'accepted': return 'accepted';
      case 'rejected': return 'rejected';
      case 'expired': return 'expired';
      default: return 'draft';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container quotation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {language === 'pt' ? 'Visualizar Orçamento' : 'View Quotation'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="quotation-view-container">
          {/* Header */}
          <div className="quotation-view-header">
            <div>
              <h2 className="quotation-number-display">{quotation.quotationNumber}</h2>
              <p className="quotation-date">
                {language === 'pt' ? 'Criado em' : 'Created on'}: {formatDate(quotation.createdAt)}
              </p>
              {quotation.validUntil && (
                <p className="quotation-date">
                  {language === 'pt' ? 'Válido até' : 'Valid until'}: {formatDate(quotation.validUntil)}
                </p>
              )}
            </div>
            <span className={`status-badge ${getStatusClass(quotation.status)}`}>
              {getStatusLabel(quotation.status)}
            </span>
          </div>

          {/* Client Info */}
          <div className="client-info">
            <h4>{language === 'pt' ? 'Cliente' : 'Client'}</h4>
            <p className="client-name-display">{quotation.clientName}</p>
            {quotation.clientEmail && (
              <p className="client-email-display">{quotation.clientEmail}</p>
            )}
          </div>

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th>{language === 'pt' ? 'Produto' : 'Product'}</th>
                <th>{language === 'pt' ? 'Qtd' : 'Qty'}</th>
                <th>{language === 'pt' ? 'Preço Unit.' : 'Unit Price'}</th>
                <th>{language === 'pt' ? 'Desc.' : 'Disc.'}</th>
                <th>{language === 'pt' ? 'Subtotal' : 'Subtotal'}</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="product-name-col">{item.productName}</div>
                    {item.productReference && (
                      <div className="product-ref-col">{item.productReference}</div>
                    )}
                  </td>
                  <td>{item.quantity}</td>
                  <td>€{item.unitPrice.toFixed(2)}</td>
                  <td>{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                  <td>€{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals-display">
            <div className="total-row">
              <span>{language === 'pt' ? 'Subtotal' : 'Subtotal'}:</span>
              <span>€{quotation.subtotal?.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>{language === 'pt' ? 'IVA' : 'Tax'} ({quotation.taxRate}%):</span>
              <span>€{quotation.taxAmount?.toFixed(2)}</span>
            </div>
            <div className="total-row total-final">
              <span>{language === 'pt' ? 'Total' : 'Total'}:</span>
              <span>€{quotation.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="quotation-notes">
              <h4>{language === 'pt' ? 'Notas / Condições' : 'Notes / Terms'}</h4>
              <p>{quotation.notes}</p>
            </div>
          )}

          {/* Footer Info */}
          <div className="quotation-notes">
            <h4>{language === 'pt' ? 'Informações' : 'Information'}</h4>
            {quotation.createdBy && (
              <p>{language === 'pt' ? 'Criado por' : 'Created by'}: {quotation.createdBy}</p>
            )}
            <p>{language === 'pt' ? 'Última atualização' : 'Last updated'}: {formatDate(quotation.updatedAt)}</p>
          </div>

          <div className="modal-actions">
            <button
              className="modal-button cancel"
              onClick={onClose}
            >
              {language === 'pt' ? 'Fechar' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
