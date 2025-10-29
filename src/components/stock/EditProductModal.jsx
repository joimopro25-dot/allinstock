import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { productService } from '../../services/productService';
import './ProductModal.css';

export function EditProductModal({ isOpen, onClose, onSuccess, product }) {
  const { company } = useAuth();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    family: '',
    type: '',
    category: '',
    unit: 'pieces',
    price: '',
    minStock: ''
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

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        reference: product.reference || '',
        family: product.family || '',
        type: product.type || '',
        category: product.category || '',
        unit: product.unit || 'pieces',
        price: product.price || '',
        minStock: product.minStock || ''
      });
    }
  }, [product]);

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
        minStock: formData.minStock ? parseInt(formData.minStock) : 0
      };

      await productService.updateProduct(company.id, product.id, productData);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update product:', err);
      setError('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('editProduct')}</h2>
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

          <div className="info-box">
            <strong>Note:</strong> To modify stock quantities, use the stock locations feature.
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
              {loading ? 'Updating...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}