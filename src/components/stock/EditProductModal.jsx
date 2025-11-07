import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { productService } from '../../services/productService';
import { supplierService } from '../../services/supplierService';
import { supplierPriceService } from '../../services/supplierPriceService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './ProductModal.css';

export function EditProductModal({ isOpen, onClose, onSuccess, product }) {
  const { company } = useAuth();
  const { language } = useLanguage();
  
  const t = (key) => getTranslation(language, key);
  
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    family: '',
    type: '',
    unit: 'pieces',
    price: '',
    minStock: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [families, setFamilies] = useState([]);
  const [types, setTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierPrices, setSupplierPrices] = useState([]);
  const [showNewFamily, setShowNewFamily] = useState(false);
  const [showNewType, setShowNewType] = useState(false);

  const units = [
    { value: 'pieces', label: 'Pieces / Peças' },
    { value: 'rolls', label: 'Rolls / Rolos' },
    { value: 'meters', label: 'Meters / Metros' },
    { value: 'kg', label: 'Kilograms / Kg' },
    { value: 'liters', label: 'Liters / Litros' },
    { value: 'boxes', label: 'Boxes / Caixas' }
  ];

  useEffect(() => {
    if (isOpen && company) {
      loadFilterOptions();
    }
  }, [isOpen, company]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        reference: product.reference || '',
        family: product.family || '',
        type: product.type || '',
        unit: product.unit || 'pieces',
        price: product.price || '',
        minStock: product.minStock || ''
      });
      // Reset toggles when product changes
      setShowNewFamily(false);
      setShowNewType(false);
      // Load supplier prices for this product
      loadSupplierPrices();
    }
  }, [product]);

  const loadSupplierPrices = async () => {
    if (!product?.id || !company?.id) return;

    try {
      const prices = await supplierPriceService.getSupplierPrices(company.id, product.id);
      setSupplierPrices(prices);
    } catch (err) {
      console.error('Failed to load supplier prices:', err);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const familiesSnapshot = await getDocs(collection(db, 'companies', company.id, 'productFamilies'));
      setFamilies(familiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const typesSnapshot = await getDocs(collection(db, 'companies', company.id, 'productTypes'));
      setTypes(typesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load suppliers
      const suppliersData = await supplierService.getSuppliers(company.id);
      setSuppliers(suppliersData.filter(s => s.status === 'active'));
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const addSupplierPrice = () => {
    setSupplierPrices([...supplierPrices, {
      supplierId: '',
      supplierReference: '',
      purchasePrice: '',
      isPreferred: supplierPrices.length === 0
    }]);
  };

  const removeSupplierPrice = async (index) => {
    const priceToRemove = supplierPrices[index];

    // If it has an ID, delete from Firestore
    if (priceToRemove.id) {
      try {
        await supplierPriceService.deleteSupplierPrice(company.id, product.id, priceToRemove.id);
      } catch (err) {
        console.error('Failed to delete supplier price:', err);
        setError('Failed to delete supplier price.');
        return;
      }
    }

    // Remove from local state
    const newPrices = supplierPrices.filter((_, i) => i !== index);
    setSupplierPrices(newPrices);
  };

  const updateSupplierPrice = (index, field, value) => {
    const newPrices = [...supplierPrices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setSupplierPrices(newPrices);
  };

  const setPreferred = (index) => {
    const newPrices = supplierPrices.map((price, i) => ({
      ...price,
      isPreferred: i === index
    }));
    setSupplierPrices(newPrices);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'family' && value === '__new__') {
      setShowNewFamily(true);
      setFormData(prev => ({ ...prev, family: '' }));
      return;
    }
    if (name === 'type' && value === '__new__') {
      setShowNewType(true);
      setFormData(prev => ({ ...prev, type: '' }));
      return;
    }

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
        unit: formData.unit,
        price: formData.price ? parseFloat(formData.price) : 0,
        minStock: formData.minStock ? parseInt(formData.minStock) : 0
      };

      await productService.updateProduct(company.id, product.id, productData);

      // Handle supplier prices - create new ones or update existing ones
      for (const supplierPrice of supplierPrices) {
        if (supplierPrice.supplierId) {
          const priceData = {
            supplierId: supplierPrice.supplierId,
            supplierReference: supplierPrice.supplierReference.trim(),
            purchasePrice: supplierPrice.purchasePrice ? parseFloat(supplierPrice.purchasePrice) : 0,
            isPreferred: supplierPrice.isPreferred || false,
            currency: 'EUR'
          };

          if (supplierPrice.id) {
            // Update existing
            await supplierPriceService.updateSupplierPrice(company.id, product.id, supplierPrice.id, priceData);
          } else {
            // Create new
            await supplierPriceService.createSupplierPrice(company.id, product.id, priceData);
          }
        }
      }

      // Update preferred supplier if changed
      const preferredPrice = supplierPrices.find(sp => sp.isPreferred);
      if (preferredPrice?.id) {
        await supplierPriceService.setPreferredSupplier(company.id, product.id, preferredPrice.id);
      }

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
              {!showNewFamily && families.length > 0 ? (
                <select
                  name="family"
                  value={formData.family}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">{language === 'pt' ? 'Selecione uma família' : 'Select a family'}</option>
                  {families.map(family => (
                    <option key={family.id} value={family.name}>
                      {family.name}
                    </option>
                  ))}
                  <option value="__new__">{language === 'pt' ? '+ Nova Família' : '+ New Family'}</option>
                </select>
              ) : (
                <input
                  type="text"
                  name="family"
                  value={formData.family}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={language === 'pt' ? 'Digite a família do produto' : 'Enter product family'}
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">{t('type')}</label>
              {!showNewType && types.length > 0 ? (
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">{language === 'pt' ? 'Selecione um tipo' : 'Select a type'}</option>
                  {types.map(type => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                  <option value="__new__">{language === 'pt' ? '+ Novo Tipo' : '+ New Type'}</option>
                </select>
              ) : (
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={language === 'pt' ? 'Digite o tipo do produto' : 'Enter product type'}
                />
              )}
            </div>
          </div>

          <div className="form-row">
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

          {/* Supplier Prices Section */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label">
                {language === 'pt' ? 'Fornecedores e Preços de Compra' : 'Suppliers & Purchase Prices'}
              </label>
              <button
                type="button"
                onClick={addSupplierPrice}
                className="add-field-btn"
                title={language === 'pt' ? 'Adicionar fornecedor' : 'Add supplier'}
              >
                + {language === 'pt' ? 'Adicionar Fornecedor' : 'Add Supplier'}
              </button>
            </div>

            {supplierPrices.map((sp, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>
                    {language === 'pt' ? 'Fornecedor' : 'Supplier'}
                  </label>
                  <select
                    value={sp.supplierId}
                    onChange={(e) => updateSupplierPrice(index, 'supplierId', e.target.value)}
                    className="form-input"
                  >
                    <option value="">{language === 'pt' ? 'Selecionar...' : 'Select...'}</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.companyName || supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>
                    {language === 'pt' ? 'Ref. Fornecedor' : 'Supplier Ref'}
                  </label>
                  <input
                    type="text"
                    value={sp.supplierReference}
                    onChange={(e) => updateSupplierPrice(index, 'supplierReference', e.target.value)}
                    className="form-input"
                    placeholder={language === 'pt' ? 'Ref. do fornecedor' : 'Supplier reference'}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>
                    {language === 'pt' ? 'Preço Compra (€)' : 'Purchase Price (€)'}
                  </label>
                  <input
                    type="number"
                    value={sp.purchasePrice}
                    onChange={(e) => updateSupplierPrice(index, 'purchasePrice', e.target.value)}
                    className="form-input"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', paddingBottom: '0.25rem' }}>
                  <input
                    type="checkbox"
                    checked={sp.isPreferred}
                    onChange={() => setPreferred(index)}
                    id={`preferred-${index}`}
                  />
                  <label htmlFor={`preferred-${index}`} style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    {language === 'pt' ? 'Preferido' : 'Preferred'}
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => removeSupplierPrice(index)}
                  className="remove-field-btn"
                  title={language === 'pt' ? 'Remover' : 'Remove'}
                >
                  ✕
                </button>
              </div>
            ))}

            {supplierPrices.length === 0 && (
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                {language === 'pt'
                  ? 'Nenhum fornecedor adicionado. Clique em "Adicionar Fornecedor" para adicionar.'
                  : 'No suppliers added. Click "Add Supplier" to add one.'}
              </p>
            )}
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