import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { supplierService } from '../../services/supplierService';
import '../stock/ProductModal.css';

export function EditSupplierModal({ isOpen, onClose, onSuccess, supplier }) {
  const { company } = useAuth();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: ''
    },
    paymentTerms: '',
    deliveryTime: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplier) {
      setFormData({
        companyName: supplier.companyName || '',
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        taxId: supplier.taxId || '',
        address: {
          street: supplier.address?.street || '',
          city: supplier.address?.city || '',
          postalCode: supplier.address?.postalCode || '',
          country: supplier.address?.country || ''
        },
        paymentTerms: supplier.paymentTerms || '',
        deliveryTime: supplier.deliveryTime || '',
        notes: supplier.notes || ''
      });
    }
  }, [supplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      setError(language === 'pt' ? 'Nome da empresa é obrigatório' : 'Company name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const supplierData = {
        companyName: formData.companyName.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        taxId: formData.taxId.trim(),
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          postalCode: formData.address.postalCode.trim(),
          country: formData.address.country.trim()
        },
        paymentTerms: formData.paymentTerms.trim(),
        deliveryTime: formData.deliveryTime.trim(),
        notes: formData.notes.trim()
      };

      await supplierService.updateSupplier(company.id, supplier.id, supplierData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update supplier:', err);
      setError(language === 'pt' ? 'Erro ao atualizar fornecedor' : 'Failed to update supplier');
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = (field, value) => {
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [field]: value
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {language === 'pt' ? 'Editar Fornecedor' : 'Edit Supplier'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'Nome da Empresa' : 'Company Name'} *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'Nome do Contacto' : 'Contact Name'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Telefone' : 'Phone'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'NIF / VAT' : 'Tax ID / VAT'}
            </label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'Morada' : 'Street Address'}
            </label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) => updateAddress('street', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Cidade' : 'City'}
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => updateAddress('city', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Código Postal' : 'Postal Code'}
              </label>
              <input
                type="text"
                value={formData.address.postalCode}
                onChange={(e) => updateAddress('postalCode', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'País' : 'Country'}
            </label>
            <input
              type="text"
              value={formData.address.country}
              onChange={(e) => updateAddress('country', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Condições de Pagamento' : 'Payment Terms'}
              </label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Prazo de Entrega' : 'Delivery Time'}
              </label>
              <input
                type="text"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'Notas' : 'Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              rows="3"
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
                ? (language === 'pt' ? 'Atualizando...' : 'Updating...')
                : t('save')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
