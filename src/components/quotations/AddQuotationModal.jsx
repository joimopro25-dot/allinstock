import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { quotationService } from '../../services/quotationService';
import { clientService } from '../../services/clientService';
import { productService } from '../../services/productService';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import '../stock/ProductModal.css';
import './QuotationModal.css';

export function AddQuotationModal({ isOpen, onClose, onSuccess }) {
  const { company, currentUser } = useAuth();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    validUntil: '',
    taxRate: 23,
    notes: '',
    items: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && company) {
      loadClients();
      loadProducts();
    }
  }, [isOpen, company]);

  const loadClients = async () => {
    try {
      const data = await clientService.getClients(company.id);
      setClients(data.filter(c => c.status === 'active'));
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts(company.id);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          productName: '',
          productReference: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0
        }
      ]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // If product is selected, auto-fill details
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].productReference = product.reference || '';
        newItems[index].unitPrice = product.price || 0;
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      return sum + itemSubtotal;
    }, 0);

    const taxAmount = subtotal * (formData.taxRate / 100);
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId) {
      setError(language === 'pt' ? 'Selecione um cliente' : 'Select a client');
      return;
    }

    if (formData.items.length === 0) {
      setError(language === 'pt' ? 'Adicione pelo menos um item' : 'Add at least one item');
      return;
    }

    const hasInvalidItems = formData.items.some(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0);
    if (hasInvalidItems) {
      setError(language === 'pt' ? 'Verifique os itens do orçamento' : 'Check quotation items');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const selectedClient = clients.find(c => c.id === formData.clientId);

      const quotationData = {
        clientId: formData.clientId,
        clientName: selectedClient?.name || '',
        clientEmail: selectedClient?.email || '',
        items: formData.items,
        taxRate: formData.taxRate,
        validUntil: formData.validUntil,
        notes: formData.notes
      };

      await quotationService.createQuotation(company.id, quotationData, currentUser?.email);
      onSuccess();
      onClose();
      setFormData({
        clientId: '',
        validUntil: '',
        taxRate: 23,
        notes: '',
        items: []
      });
    } catch (err) {
      console.error('Failed to create quotation:', err);
      setError(language === 'pt' ? 'Erro ao criar orçamento' : 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container quotation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {language === 'pt' ? 'Criar Orçamento' : 'Create Quotation'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Cliente' : 'Client'} *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="form-input"
                required
              >
                <option value="">{language === 'pt' ? 'Selecione um cliente' : 'Select a client'}</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.companyName && `(${client.companyName})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Válido Até' : 'Valid Until'}
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="items-section">
            <div className="items-header">
              <h3>{language === 'pt' ? 'Itens' : 'Items'}</h3>
              <button type="button" className="add-item-button" onClick={addItem}>
                <PlusIcon className="button-icon" />
                {language === 'pt' ? 'Adicionar Item' : 'Add Item'}
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="item-fields">
                  <div className="form-group item-product">
                    <label className="form-label">{language === 'pt' ? 'Produto' : 'Product'}</label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="form-input"
                      required
                    >
                      <option value="">{language === 'pt' ? 'Selecione' : 'Select'}</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.reference && `(${product.reference})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group item-quantity">
                    <label className="form-label">{language === 'pt' ? 'Qtd' : 'Qty'}</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      min="0"
                      step="1"
                      required
                    />
                  </div>

                  <div className="form-group item-price">
                    <label className="form-label">{language === 'pt' ? 'Preço Unit.' : 'Unit Price'}</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group item-discount">
                    <label className="form-label">{language === 'pt' ? 'Desc. %' : 'Disc. %'}</label>
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div className="form-group item-subtotal">
                    <label className="form-label">{language === 'pt' ? 'Subtotal' : 'Subtotal'}</label>
                    <div className="item-subtotal-value">
                      €{(item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)).toFixed(2)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="remove-item-button"
                  onClick={() => removeItem(index)}
                  title={language === 'pt' ? 'Remover' : 'Remove'}
                >
                  <TrashIcon className="button-icon" />
                </button>
              </div>
            ))}

            {formData.items.length === 0 && (
              <div className="empty-items">
                {language === 'pt' ? 'Nenhum item adicionado. Clique em "Adicionar Item" para começar.' : 'No items added. Click "Add Item" to start.'}
              </div>
            )}
          </div>

          <div className="totals-section">
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Taxa de IVA (%)' : 'Tax Rate (%)'}
              </label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="form-input"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="totals-display">
              <div className="total-row">
                <span>{language === 'pt' ? 'Subtotal' : 'Subtotal'}:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>{language === 'pt' ? 'IVA' : 'Tax'} ({formData.taxRate}%):</span>
                <span>€{taxAmount.toFixed(2)}</span>
              </div>
              <div className="total-row total-final">
                <span>{language === 'pt' ? 'Total' : 'Total'}:</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'Notas / Condições' : 'Notes / Terms'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              rows="3"
              placeholder={language === 'pt' ? 'Condições de pagamento, prazos de entrega, etc.' : 'Payment terms, delivery times, etc.'}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button cancel"
              onClick={onClose}
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="modal-button submit"
              disabled={loading}
            >
              {loading
                ? (language === 'pt' ? 'Criando...' : 'Creating...')
                : (language === 'pt' ? 'Criar Orçamento' : 'Create Quotation')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
