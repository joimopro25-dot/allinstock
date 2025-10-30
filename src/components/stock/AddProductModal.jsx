import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { productService } from '../../services/productService';
import './ProductModal.css';

export function AddProductModal({ isOpen, onClose, onSuccess }) {
  const { company } = useAuth();
  const { language } = useLanguage();
  
  const t = (key) => getTranslation(language, key);
  
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    family: '',
    type: '',
    category: '',
    unit: 'pieces',
    price: '',
    minStock: '',
    initialStock: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const units = [
    { value: 'pieces', label: 'Pieces / Peças' },
    { value: 'rolls', label: 'Rolls / Rolos' },
    { value: 'meters', label: 'Meters / Metros' },
    { value: 'kg', label: 'Kilograms / Kg' },
    { value: 'liters', label: 'Liters / Litros' },
    { value: 'boxes', label: 'Boxes / Caixas' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const productData = {
        name: formData.name.trim(),
        reference: formData.reference.trim(),
        family: formData.family.trim(),
        type: formData.type.trim(),
        category: formData.category.trim(),
        unit: formData.unit,
        price: formData.price ? parseFloat(formData.price) : 0,
        minStock: formData.minStock ? parseInt(formData.minStock) : 0,
        initialStock: formData.initialStock ? parseInt(formData.initialStock) : 0
      };

      await productService.createProduct(company.id, productData);
      
      setFormData({
        name: '',
        reference: '',
        family: '',
        type: '',
        category: '',
        unit: 'pieces',
        price: '',
        minStock: '',
        initialStock: ''
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create product:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('addProduct')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="modal-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('productName')} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('reference')}</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('family')}</label>
              <input
                type="text"
                name="family"
                value={formData.family}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('type')}</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('unit')}</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="form-input"
              >
                {units.map(unit => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('price')} (€)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('minStock')}</label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                className="form-input"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Stock</label>
            <input
              type="number"
              name="initialStock"
              value={formData.initialStock}
              onChange={handleChange}
              className="form-input"
              min="0"
            />
            <span className="form-hint">
              This will be added to "Main Warehouse" location
            </span>
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
              {loading ? 'Creating...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}