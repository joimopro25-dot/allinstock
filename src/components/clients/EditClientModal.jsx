import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { clientService } from '../../services/clientService';
import '../stock/ProductModal.css';

export function EditClientModal({ isOpen, onClose, onSuccess, client }) {
  const { company } = useAuth();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    taxId: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: ''
    },
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        companyName: client.companyName || '',
        email: client.email || '',
        phone: client.phone || '',
        taxId: client.taxId || '',
        address: {
          street: client.address?.street || '',
          city: client.address?.city || '',
          postalCode: client.address?.postalCode || '',
          country: client.address?.country || ''
        },
        notes: client.notes || ''
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError(language === 'pt' ? 'Nome é obrigatório' : 'Name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const clientData = {
        name: formData.name.trim(),
        companyName: formData.companyName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        taxId: formData.taxId.trim(),
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          postalCode: formData.address.postalCode.trim(),
          country: formData.address.country.trim()
        },
        notes: formData.notes.trim()
      };

      await clientService.updateClient(company.id, client.id, clientData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update client:', err);
      setError(language === 'pt' ? 'Erro ao atualizar cliente' : 'Failed to update client');
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
            {language === 'pt' ? 'Editar Cliente' : 'Edit Client'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'Nome Completo' : 'Full Name'} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'pt' ? 'Empresa' : 'Company Name'}
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
