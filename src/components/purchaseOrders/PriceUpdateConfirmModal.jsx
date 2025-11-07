import { XMarkIcon } from '@heroicons/react/24/outline';
import './PriceUpdateConfirmModal.css';

export function PriceUpdateConfirmModal({ isOpen, onClose, onConfirm, onSkip, priceChanges, language }) {
  if (!isOpen || !priceChanges || priceChanges.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="price-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {language === 'pt' ? 'Atualizar Preços de Fornecedores?' : 'Update Supplier Prices?'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon className="close-icon" />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            {language === 'pt'
              ? 'Os seguintes produtos têm preços diferentes dos registados. Deseja atualizar os preços dos fornecedores?'
              : 'The following products have different prices from those recorded. Do you want to update the supplier prices?'}
          </p>

          <div className="price-changes-list">
            {priceChanges.map((change, index) => (
              <div key={index} className="price-change-item">
                <div className="product-info">
                  <strong>{change.productName}</strong>
                  <span className="supplier-name">{change.supplierName}</span>
                </div>
                <div className="price-comparison">
                  <div className="price-old">
                    <span className="price-label">
                      {language === 'pt' ? 'Preço Atual:' : 'Current Price:'}
                    </span>
                    <span className="price-value">
                      {change.isNew
                        ? (language === 'pt' ? 'Nenhum' : 'None')
                        : `€${change.oldPrice?.toFixed(2) || '0.00'}`}
                    </span>
                  </div>
                  <div className="price-arrow">→</div>
                  <div className="price-new">
                    <span className="price-label">
                      {language === 'pt' ? 'Novo Preço:' : 'New Price:'}
                    </span>
                    <span className="price-value">€{change.newPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onSkip}>
            {language === 'pt' ? 'Continuar sem Atualizar' : 'Continue Without Updating'}
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            {language === 'pt' ? 'Atualizar Preços' : 'Update Prices'}
          </button>
        </div>
      </div>
    </div>
  );
}
