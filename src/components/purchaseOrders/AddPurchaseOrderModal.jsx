import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export function AddPurchaseOrderModal({ isOpen, onClose, onSuccess }) {
  const { company } = useAuth();
  const { language } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    items: [{ productId: '', productName: '', quantity: 1, price: 0 }],
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && company?.id) {
      loadSuppliers();
      loadProducts();
    }
  }, [isOpen, company?.id]);

  const loadSuppliers = async () => {
    try {
      const suppliersSnapshot = await getDocs(collection(db, 'companies', company.id, 'suppliers'));
      setSuppliers(suppliersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const productsSnapshot = await getDocs(collection(db, 'companies', company.id, 'products'));
      setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleSupplierChange = (e) => {
    const supplierId = e.target.value;
    const supplier = suppliers.find(s => s.id === supplierId);
    setFormData({
      ...formData,
      supplierId,
      supplierName: supplier?.name || ''
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index].productName = product?.name || '';
      newItems[index].price = product?.price || 0;
    }

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', productName: '', quantity: 1, price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierId || formData.items.length === 0) return;

    try {
      setSaving(true);
      await purchaseOrderService.createPurchaseOrder(company.id, {
        ...formData,
        total: calculateTotal(),
        status: 'ordered'
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      alert(language === 'pt' ? 'Erro ao criar encomenda' : 'Error creating order');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      supplierName: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      items: [{ productId: '', productName: '', quantity: 1, price: 0 }],
      notes: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 600 }}>
            {language === 'pt' ? 'Nova Encomenda' : 'New Purchase Order'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0.5rem' }}>
            <XMarkIcon style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                {language === 'pt' ? 'Fornecedor' : 'Supplier'} *
              </label>
              <select
                value={formData.supplierId}
                onChange={handleSupplierChange}
                required
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.875rem' }}
              >
                <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                {language === 'pt' ? 'Data da Encomenda' : 'Order Date'} *
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              {language === 'pt' ? 'Entrega Prevista' : 'Expected Delivery'}
            </label>
            <input
              type="date"
              value={formData.expectedDate}
              onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {language === 'pt' ? 'Itens' : 'Items'} *
              </label>
              <button
                type="button"
                onClick={addItem}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '6px', color: '#8b5cf6', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                {language === 'pt' ? 'Adicionar Item' : 'Add Item'}
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <select
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  required
                  style={{ padding: '0.625rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontSize: '0.875rem' }}
                >
                  <option value="">{language === 'pt' ? 'Produto' : 'Product'}</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                  min="1"
                  required
                  placeholder={language === 'pt' ? 'Qtd' : 'Qty'}
                  style={{ padding: '0.625rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontSize: '0.875rem' }}
                />
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  required
                  placeholder={language === 'pt' ? 'Preço' : 'Price'}
                  style={{ padding: '0.625rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontSize: '0.875rem' }}
                />
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{ padding: '0.625rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <TrashIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                )}
              </div>
            ))}

            <div style={{ textAlign: 'right', marginTop: '1rem', padding: '1rem', background: 'rgba(139,92,246,0.1)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.3)' }}>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginRight: '1rem' }}>
                {language === 'pt' ? 'Total' : 'Total'}:
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a78bfa' }}>
                €{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              {language === 'pt' ? 'Notas' : 'Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '0.875rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving || !formData.supplierId || formData.items.length === 0}
              style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: (saving || !formData.supplierId || formData.items.length === 0) ? 0.4 : 1 }}
            >
              {saving ? (language === 'pt' ? 'A Criar...' : 'Creating...') : (language === 'pt' ? 'Criar Encomenda' : 'Create Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
