import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { productService } from '../../services/productService';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { AddProductModal } from '../../components/stock/AddProductModal';
import { EditProductModal } from '../../components/stock/EditProductModal';
import '../../styles/ProductList.css';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, product: null });
  
  const { company, user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [company]);

  const loadProducts = async () => {
    if (!company) return;
    
    try {
      setLoading(true);
      const data = await productService.getProducts(company.id);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    
    try {
      await productService.deleteProduct(company.id, deleteModal.product.id);
      await loadProducts();
      setDeleteModal({ show: false, product: null });
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const getStockStatus = (product) => {
    if (product.totalStock === 0) return 'out';
    if (product.totalStock <= product.minStock) return 'low';
    return 'in';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesFamily = familyFilter === 'all' || product.family === familyFilter;
    return matchesSearch && matchesFamily;
  });

  const families = [...new Set(products.map(p => p.family).filter(Boolean))];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <div className="product-list-container">
      <div className="product-header">
        <div className="header-left">
          <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            AllInStock
          </h1>
          <h2 className="page-title">{t('productList')}</h2>
        </div>
        
        <div className="header-right">
          <LanguageToggle />
          <button className="logout-button" onClick={handleLogout}>
            {t('logout')}
          </button>
        </div>
      </div>

      <div className="product-content">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select 
            value={familyFilter} 
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('allFamilies')}</option>
            {families.map(family => (
              <option key={family} value={family}>{family}</option>
            ))}
          </select>
          
          <button 
            className="add-button"
            onClick={() => setAddModalOpen(true)}
          >
            {t('addProduct')}
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>No products found</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => {
              const status = getStockStatus(product);
              return (
                <div key={product.id} className="product-card">
                  <div className="product-card-header">
                    <h3 className="product-name">{product.name}</h3>
                    <span className={`stock-badge ${status}`}>
                      {status === 'out' && t('outOfStock')}
                      {status === 'low' && t('lowStock')}
                      {status === 'in' && t('inStock')}
                    </span>
                  </div>
                  
                  <div className="product-details">
                    {product.reference && (
                      <div className="detail-row">
                        <span className="detail-label">{t('reference')}:</span>
                        <span className="detail-value">{product.reference}</span>
                      </div>
                    )}
                    {product.family && (
                      <div className="detail-row">
                        <span className="detail-label">{t('family')}:</span>
                        <span className="detail-value">{product.family}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">{t('totalStock')}:</span>
                      <span className="detail-value">{product.totalStock} {product.unit}</span>
                    </div>
                    {product.price > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">{t('price')}:</span>
                        <span className="detail-value">€{product.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="product-actions">
                    <button 
                      className="action-button edit"
                      onClick={() => setEditModal({ show: true, product })}
                    >
                      {t('edit')}
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => setDeleteModal({ show: true, product })}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadProducts}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={editModal.show}
        onClose={() => setEditModal({ show: false, product: null })}
        onSuccess={loadProducts}
        product={editModal.product}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, product: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{t('deleteProduct')}</h3>
            <p className="modal-text">{t('confirmDelete')}</p>
            <p className="modal-warning">{t('deleteWarning')}</p>
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => setDeleteModal({ show: false, product: null })}
              >
                {t('cancel')}
              </button>
              <button 
                className="modal-button confirm"
                onClick={handleDelete}
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}