import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { clientService } from '../../services/clientService';
import '../stock/ProductModal.css';

export function AddClientModal({ isOpen, onClose, onSuccess }) {
  const { company } = useAuth();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    emails: [''],
    phones: [''],
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

  const addEmailField = () => {
    setFormData({ ...formData, emails: [...formData.emails, ''] });
  };

  const removeEmailField = (index) => {
    const newEmails = formData.emails.filter((_, i) => i !== index);
    setFormData({ ...formData, emails: newEmails.length > 0 ? newEmails : [''] });
  };

  const updateEmail = (index, value) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  const addPhoneField = () => {
    setFormData({ ...formData, phones: [...formData.phones, ''] });
  };

  const removePhoneField = (index) => {
    const newPhones = formData.phones.filter((_, i) => i !== index);
    setFormData({ ...formData, phones: newPhones.length > 0 ? newPhones : [''] });
  };

  const updatePhone = (index, value) => {
    const newPhones = [...formData.phones];
    newPhones[index] = value;
    setFormData({ ...formData, phones: newPhones });
  };

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
        emails: formData.emails.filter(e => e.trim()).map(e => e.trim()),
        phones: formData.phones.filter(p => p.trim()).map(p => p.trim()),
        // Keep legacy single email/phone for backward compatibility
        email: formData.emails[0]?.trim() || '',
        phone: formData.phones[0]?.trim() || '',
        taxId: formData.taxId.trim(),
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          postalCode: formData.address.postalCode.trim(),
          country: formData.address.country.trim()
        },
        notes: formData.notes.trim()
      };

      await clientService.createClient(company.id, clientData);
      onSuccess();
      onClose();
      setFormData({
        name: '',
        companyName: '',
        emails: [''],
        phones: [''],
        taxId: '',
        address: { street: '', city: '', postalCode: '', country: '' },
        notes: ''
      });
    } catch (err) {
      console.error('Failed to create client:', err);
      setError(language === 'pt' ? 'Erro ao criar cliente' : 'Failed to create client');
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
            {language === 'pt' ? 'Adicionar Cliente' : 'Add Client'}
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
              placeholder={language === 'pt' ? 'Ex: João Silva' : 'Ex: John Doe'}
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
              placeholder={language === 'pt' ? 'Ex: Empresa ABC' : 'Ex: ABC Company'}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Emails' : 'Emails'}
              </label>
              {formData.emails.map((email, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className="form-input"
                    placeholder="email@example.com"
                    style={{ flex: 1 }}
                  />
                  {formData.emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="remove-field-btn"
                      title={language === 'pt' ? 'Remover' : 'Remove'}
                    >
                      ✕
                    </button>
                  )}
                  {index === formData.emails.length - 1 && (
                    <button
                      type="button"
                      onClick={addEmailField}
                      className="add-field-btn"
                      title={language === 'pt' ? 'Adicionar email' : 'Add email'}
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Telefones' : 'Phones'}
              </label>
              {formData.phones.map((phone, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => updatePhone(index, e.target.value)}
                    className="form-input"
                    placeholder="+351 912 345 678"
                    style={{ flex: 1 }}
                  />
                  {formData.phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhoneField(index)}
                      className="remove-field-btn"
                      title={language === 'pt' ? 'Remover' : 'Remove'}
                    >
                      ✕
                    </button>
                  )}
                  {index === formData.phones.length - 1 && (
                    <button
                      type="button"
                      onClick={addPhoneField}
                      className="add-field-btn"
                      title={language === 'pt' ? 'Adicionar telefone' : 'Add phone'}
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
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
              placeholder={language === 'pt' ? 'Ex: 123456789' : 'Ex: 123456789'}
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
              placeholder={language === 'pt' ? 'Rua, número, andar' : 'Street, number, floor'}
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
                placeholder={language === 'pt' ? 'Lisboa' : 'Lisbon'}
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
                placeholder="1000-000"
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
              placeholder={language === 'pt' ? 'Portugal' : 'Portugal'}
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
              placeholder={language === 'pt' ? 'Observações adicionais...' : 'Additional notes...'}
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
                ? (language === 'pt' ? 'Adicionando...' : 'Adding...')
                : (language === 'pt' ? 'Adicionar' : 'Add')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
