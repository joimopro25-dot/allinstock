import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { productService } from '../../services/productService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { Sidebar } from '../../components/common/Sidebar';
import { AddProductModal } from '../../components/stock/AddProductModal';
import { EditProductModal } from '../../components/stock/EditProductModal';
import { StockLocationsModal } from '../../components/stock/StockLocationsModal';
import { StockMovementsModal } from '../../components/stock/StockMovementsModal';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { migrateProductFields } from '../../utils/migrateProductFields';
import '../../styles/ProductList.css';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [families, setFamilies] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, product: null });
  const [locationsModal, setLocationsModal] = useState({ show: false, product: null });
  const [movementsModal, setMovementsModal] = useState({ show: false, product: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { company, currentUser, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    if (company?.id) {
      loadProducts();
      loadFilterOptions();
    }
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

  const loadFilterOptions = async () => {
    try {
      // Load families
      const familiesSnapshot = await getDocs(collection(db, 'companies', company.id, 'productFamilies'));
      setFamilies(familiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load types
      const typesSnapshot = await getDocs(collection(db, 'companies', company.id, 'productTypes'));
      setTypes(typesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load categories
      const categoriesSnapshot = await getDocs(collection(db, 'companies', company.id, 'productCategories'));
      setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Failed to load filter options:', err);
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
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.reference?.toLowerCase().includes(search.toLowerCase());

    // Family filter
    const matchesFamily = familyFilter === 'all' || product.familyId === familyFilter;

    // Type filter
    const matchesType = typeFilter === 'all' || product.typeId === typeFilter;

    // Category filter
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;

    // Stock status filter
    const status = getStockStatus(product);
    const matchesStockStatus = stockStatusFilter === 'all' || status === stockStatusFilter;

    // Price range filter
    const productPrice = product.price || 0;
    const matchesMinPrice = minPrice === '' || productPrice >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || productPrice <= parseFloat(maxPrice);

    return matchesSearch && matchesFamily && matchesType && matchesCategory &&
           matchesStockStatus && matchesMinPrice && matchesMaxPrice;
  });

  const clearFilters = () => {
    setFamilyFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStockStatusFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
  };

  const activeFilterCount = [
    familyFilter !== 'all',
    typeFilter !== 'all',
    categoryFilter !== 'all',
    stockStatusFilter !== 'all',
    minPrice !== '',
    maxPrice !== ''
  ].filter(Boolean).length;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  const handleMigration = async () => {
    if (!company?.id) return;

    const confirmed = window.confirm(
      language === 'pt'
        ? 'Isto irá criar listas de Famílias, Tipos e Categorias baseadas nos produtos existentes. Continuar?'
        : 'This will create Family, Type, and Category lists based on existing products. Continue?'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await migrateProductFields(company.id);

      if (result.success) {
        alert(result.message);
        await loadFilterOptions(); // Reload the filter options
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error('Migration error:', err);
      alert('Migration failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className={`product-list-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="product-header">
        <div className="header-left">
          <h1 className="logo-text" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            AllInStock
          </h1>
          <h2 className="page-title">{t('stockManagement')}</h2>
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

          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon style={{ width: '18px', height: '18px' }} />
            {language === 'pt' ? 'Filtros' : 'Filters'}
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          {families.length === 0 && types.length === 0 && categories.length === 0 && products.length > 0 && (
            <button
              className="migration-button"
              onClick={handleMigration}
              title={language === 'pt' ? 'Criar listas de dropdown dos produtos existentes' : 'Create dropdown lists from existing products'}
            >
              {language === 'pt' ? '⚡ Migrar Dados' : '⚡ Migrate Data'}
            </button>
          )}

          <button
            className="add-button"
            onClick={() => setAddModalOpen(true)}
          >
            {t('addProduct')}
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>{language === 'pt' ? 'Família' : 'Family'}</label>
                <select
                  value={familyFilter}
                  onChange={(e) => setFamilyFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{language === 'pt' ? 'Todas' : 'All'}</option>
                  {families.map(family => (
                    <option key={family.id} value={family.id}>{family.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>{language === 'pt' ? 'Tipo' : 'Type'}</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{language === 'pt' ? 'Todos' : 'All'}</option>
                  {types.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>{language === 'pt' ? 'Categoria' : 'Category'}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{language === 'pt' ? 'Todas' : 'All'}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>{language === 'pt' ? 'Status do Stock' : 'Stock Status'}</label>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{language === 'pt' ? 'Todos' : 'All'}</option>
                  <option value="in">{language === 'pt' ? 'Em Stock' : 'In Stock'}</option>
                  <option value="low">{language === 'pt' ? 'Stock Baixo' : 'Low Stock'}</option>
                  <option value="out">{language === 'pt' ? 'Sem Stock' : 'Out of Stock'}</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>{language === 'pt' ? 'Preço Mínimo' : 'Min Price'}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>{language === 'pt' ? 'Preço Máximo' : 'Max Price'}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group" style={{ flex: 2 }}>
                <label>&nbsp;</label>
                <button
                  className="clear-filters-button"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                >
                  <XMarkIcon style={{ width: '18px', height: '18px' }} />
                  {language === 'pt' ? 'Limpar Filtros' : 'Clear Filters'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">{t('loading')}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>{t('noProducts')}</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => {
              const status = getStockStatus(product);
              return (
                <div key={product.id} className="product-card" onClick={() => navigate(`/stock/${product.id}`)} style={{ cursor: 'pointer' }}>
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
                  
                  <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="action-button locations"
                      onClick={() => setLocationsModal({ show: true, product })}
                    >
                      {language === 'pt' ? 'Localizações' : 'Locations'}
                    </button>
                    <button
                      className="action-button history"
                      onClick={() => setMovementsModal({ show: true, product })}
                    >
                      {language === 'pt' ? 'Histórico' : 'History'}
                    </button>
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

      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadProducts}
      />

      <EditProductModal
        isOpen={editModal.show}
        onClose={() => setEditModal({ show: false, product: null })}
        onSuccess={loadProducts}
        product={editModal.product}
      />

      <StockLocationsModal
        isOpen={locationsModal.show}
        onClose={() => setLocationsModal({ show: false, product: null })}
        product={locationsModal.product}
        onUpdate={loadProducts}
      />

      <StockMovementsModal
        isOpen={movementsModal.show}
        onClose={() => setMovementsModal({ show: false, product: null })}
        product={movementsModal.product}
      />

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
    </>
  );
}