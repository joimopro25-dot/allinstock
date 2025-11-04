import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { Sidebar } from '../../components/common/Sidebar';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  MapPinIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import './StockLocations.css';

export default function StockLocations() {
  const { company } = useAuth();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedLocation, setExpandedLocation] = useState(null);

  useEffect(() => {
    if (company?.id) {
      loadData();
    }
  }, [company?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadLocations(), loadProducts()]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    // Aggregate unique locations from all products
    const productsSnapshot = await getDocs(collection(db, 'companies', company.id, 'products'));
    const locationMap = new Map();

    for (const productDoc of productsSnapshot.docs) {
      const locationsSnapshot = await getDocs(
        collection(db, 'companies', company.id, 'products', productDoc.id, 'stockLocations')
      );

      locationsSnapshot.docs.forEach(locDoc => {
        const locData = locDoc.data();
        const locationKey = locData.name; // Use name as unique key

        if (!locationMap.has(locationKey)) {
          locationMap.set(locationKey, {
            id: locationKey,
            name: locData.name,
            type: locData.type || 'warehouse',
            address: locData.address || '',
            contactPerson: locData.contactPerson || '',
            contactPhone: locData.contactPhone || ''
          });
        }
      });
    }

    setLocations(Array.from(locationMap.values()));
  };

  const loadProducts = async () => {
    const snapshot = await getDocs(collection(db, 'companies', company.id, 'products'));
    const productsData = [];

    for (const productDoc of snapshot.docs) {
      const productData = {
        id: productDoc.id,
        ...productDoc.data()
      };

      // Load stock locations for this product
      const locationsSnapshot = await getDocs(
        collection(db, 'companies', company.id, 'products', productDoc.id, 'stockLocations')
      );

      productData.stockLocations = locationsSnapshot.docs.map(locDoc => ({
        id: locDoc.id,
        ...locDoc.data()
      }));

      // Calculate total stock
      productData.totalStock = productData.stockLocations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);

      productsData.push(productData);
    }

    setProducts(productsData);
  };

  const handleAddLocation = async (locationData) => {
    await addDoc(collection(db, 'companies', company.id, 'stockLocations'), {
      ...locationData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await loadLocations();
    setShowAddModal(false);
  };

  const handleEditLocation = async (locationId, locationData) => {
    await updateDoc(doc(db, 'companies', company.id, 'stockLocations', locationId), {
      ...locationData,
      updatedAt: new Date()
    });
    await loadLocations();
    setEditLocation(null);
  };

  const handleDeleteLocation = async (locationId) => {
    await deleteDoc(doc(db, 'companies', company.id, 'stockLocations', locationId));
    await loadLocations();
    setDeleteConfirm(null);
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'warehouse':
        return <BuildingStorefrontIcon className="location-icon" />;
      case 'van':
        return <TruckIcon className="location-icon" />;
      case 'office':
        return <BuildingOfficeIcon className="location-icon" />;
      default:
        return <MapPinIcon className="location-icon" />;
    }
  };

  const getLocationTypeLabel = (type) => {
    const labels = {
      warehouse: language === 'pt' ? 'Armazém' : 'Warehouse',
      van: language === 'pt' ? 'Carrinha' : 'Van',
      office: language === 'pt' ? 'Escritório' : 'Office',
      workplace: language === 'pt' ? 'Local de Trabalho' : 'Workplace'
    };
    return labels[type] || type;
  };

  const getStockByLocation = (locationId) => {
    // locationId is now the location name (used as unique key)
    const locationName = locationId;

    return products.reduce((acc, product) => {
      // Find stock location with matching name
      const stockInLocation = product.stockLocations?.find(
        sl => sl.name === locationName
      );

      if (stockInLocation && stockInLocation.quantity > 0) {
        acc.push({
          ...product,
          locationQuantity: stockInLocation.quantity
        });
      }
      return acc;
    }, []);
  };

  const getTotalStockValue = (locationId) => {
    const stockItems = getStockByLocation(locationId);
    return stockItems.reduce((sum, item) => sum + (item.locationQuantity * (item.price || 0)), 0);
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || location.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalLocations = locations.length;
  const totalProducts = products.length;
  const totalStockValue = locations.reduce((sum, loc) => sum + getTotalStockValue(loc.id), 0);

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      <div className="stock-locations-page" style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}>
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <MapPinIcon className="title-icon" />
              {language === 'pt' ? 'Localizações de Stock' : 'Stock Locations'}
            </h1>
            <p className="page-subtitle">
              {language === 'pt' ? 'Vista 360° do seu inventário' : '360° view of your inventory'}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={loadData}>
              <ArrowPathIcon className="btn-icon" />
              {language === 'pt' ? 'Atualizar' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon warehouse">
              <MapPinIcon />
            </div>
            <div className="analytics-content">
              <div className="analytics-label">{language === 'pt' ? 'Total Localizações' : 'Total Locations'}</div>
              <div className="analytics-value">{totalLocations}</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon products">
              <CubeIcon />
            </div>
            <div className="analytics-content">
              <div className="analytics-label">{language === 'pt' ? 'Produtos' : 'Products'}</div>
              <div className="analytics-value">{totalProducts}</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon value">
              <BuildingStorefrontIcon />
            </div>
            <div className="analytics-content">
              <div className="analytics-label">{language === 'pt' ? 'Valor Total Stock' : 'Total Stock Value'}</div>
              <div className="analytics-value">€{totalStockValue.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Location Hierarchy Dashboard - 360° View */}
        <div className="location-hierarchy-section">
          <div className="section-header">
            <h2 className="section-title">
              <ChartBarIcon className="title-icon" />
              {language === 'pt' ? 'Distribuição de Stock por Localização' : 'Stock Distribution by Location'}
            </h2>
          </div>

          <div className="hierarchy-container">
            {['warehouse', 'van', 'office', 'workplace'].map(type => {
              const typeLocations = locations.filter(loc => loc.type === type);
              if (typeLocations.length === 0) return null;

              const typeTotalProducts = typeLocations.reduce((sum, loc) => sum + getStockByLocation(loc.id).length, 0);
              const typeTotalValue = typeLocations.reduce((sum, loc) => sum + getTotalStockValue(loc.id), 0);
              const maxValue = Math.max(...locations.map(loc => getTotalStockValue(loc.id))) || 1;

              return (
                <div key={type} className="location-type-group">
                  <div className="type-header">
                    <div className="type-title">
                      {getLocationIcon(type)}
                      <span>{getLocationTypeLabel(type)}s</span>
                    </div>
                    <div className="type-stats">
                      <span className="stat-badge">{typeLocations.length} {language === 'pt' ? 'locais' : 'locations'}</span>
                      <span className="stat-badge">{typeTotalProducts} {language === 'pt' ? 'produtos' : 'products'}</span>
                      <span className="stat-badge value">€{typeTotalValue.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="type-locations">
                    {typeLocations.map(location => {
                      const stockItems = getStockByLocation(location.id);
                      const locationValue = getTotalStockValue(location.id);
                      const valuePercentage = (locationValue / maxValue) * 100;
                      const isExpanded = expandedLocation === location.id;

                      return (
                        <div key={location.id} className="hierarchy-location-card">
                          <div
                            className="hierarchy-card-header"
                            onClick={() => setExpandedLocation(isExpanded ? null : location.id)}
                          >
                            <div className="location-info">
                              <h4>{location.name}</h4>
                              {location.address && (
                                <p className="location-address-small">
                                  <MapPinIcon className="mini-icon" />
                                  {location.address}
                                </p>
                              )}
                            </div>
                            <div className="location-metrics">
                              <div className="metric">
                                <span className="metric-value">{stockItems.length}</span>
                                <span className="metric-label">{language === 'pt' ? 'produtos' : 'products'}</span>
                              </div>
                              <div className="metric value-metric">
                                <span className="metric-value">€{locationValue.toFixed(2)}</span>
                                <span className="metric-label">{language === 'pt' ? 'valor' : 'value'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Stock Distribution Bar */}
                          <div className="stock-distribution-bar">
                            <div
                              className="distribution-fill"
                              style={{ width: `${valuePercentage}%` }}
                            >
                              {valuePercentage > 10 && (
                                <span className="distribution-label">
                                  {valuePercentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expanded Stock Details */}
                          {isExpanded && stockItems.length > 0 && (
                            <div className="expanded-stock-details">
                              <div className="stock-details-header">
                                <CubeIcon className="mini-icon" />
                                <span>{language === 'pt' ? 'Stock nesta localização' : 'Stock at this location'}</span>
                              </div>
                              <div className="stock-details-list">
                                {stockItems.map(item => (
                                  <div key={item.id} className="stock-detail-item">
                                    <span className="item-name">{item.name}</span>
                                    <div className="item-details">
                                      <span className="item-quantity">{item.locationQuantity} {item.unit}</span>
                                      <span className="item-value">€{(item.locationQuantity * (item.price || 0)).toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {locations.length === 0 && (
              <div className="hierarchy-empty">
                <MapPinIcon className="empty-icon-large" />
                <p>{language === 'pt' ? 'Nenhuma localização encontrada' : 'No locations found'}</p>
                <p className="empty-hint">
                  {language === 'pt'
                    ? 'Adicione stock aos produtos para que as localizações apareçam aqui'
                    : 'Add stock to products so locations appear here'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-box">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              placeholder={language === 'pt' ? 'Pesquisar localização...' : 'Search location...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedType('all')}
            >
              {language === 'pt' ? 'Todas' : 'All'}
            </button>
            <button
              className={`filter-btn ${selectedType === 'warehouse' ? 'active' : ''}`}
              onClick={() => setSelectedType('warehouse')}
            >
              <BuildingStorefrontIcon className="filter-icon" />
              {language === 'pt' ? 'Armazéns' : 'Warehouses'}
            </button>
            <button
              className={`filter-btn ${selectedType === 'van' ? 'active' : ''}`}
              onClick={() => setSelectedType('van')}
            >
              <TruckIcon className="filter-icon" />
              {language === 'pt' ? 'Carrinhas' : 'Vans'}
            </button>
            <button
              className={`filter-btn ${selectedType === 'office' ? 'active' : ''}`}
              onClick={() => setSelectedType('office')}
            >
              <BuildingOfficeIcon className="filter-icon" />
              {language === 'pt' ? 'Escritórios' : 'Offices'}
            </button>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="locations-grid">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{language === 'pt' ? 'A carregar...' : 'Loading...'}</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="empty-state">
              <MapPinIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhuma localização encontrada' : 'No locations found'}</p>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                <PlusIcon className="btn-icon" />
                {language === 'pt' ? 'Criar Primeira Localização' : 'Create First Location'}
              </button>
            </div>
          ) : (
            filteredLocations.map(location => {
              const stockItems = getStockByLocation(location.id);
              const totalValue = getTotalStockValue(location.id);

              return (
                <div key={location.id} className="location-card">
                  <div className="card-header">
                    <div className="location-title">
                      {getLocationIcon(location.type)}
                      <div>
                        <h3>{location.name}</h3>
                        <span className="location-type-badge">{getLocationTypeLabel(location.type)}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => setEditLocation(location)}
                        title={language === 'pt' ? 'Editar' : 'Edit'}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteConfirm(location)}
                        title={language === 'pt' ? 'Eliminar' : 'Delete'}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  <div className="card-body">
                    {location.address && (
                      <p className="location-address">
                        <MapPinIcon className="address-icon" />
                        {location.address}
                      </p>
                    )}

                    <div className="stock-summary">
                      <div className="summary-item">
                        <span className="summary-label">{language === 'pt' ? 'Produtos' : 'Products'}:</span>
                        <span className="summary-value">{stockItems.length}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">{language === 'pt' ? 'Valor' : 'Value'}:</span>
                        <span className="summary-value">€{totalValue.toFixed(2)}</span>
                      </div>
                    </div>

                    {stockItems.length > 0 && (
                      <div className="stock-items">
                        <h4>{language === 'pt' ? 'Stock nesta localização' : 'Stock at this location'}:</h4>
                        <div className="items-list">
                          {stockItems.slice(0, 3).map(item => (
                            <div key={item.id} className="stock-item">
                              <span className="item-name">{item.name}</span>
                              <span className="item-quantity">{item.locationQuantity} {item.unit}</span>
                            </div>
                          ))}
                          {stockItems.length > 3 && (
                            <div className="more-items">
                              +{stockItems.length - 3} {language === 'pt' ? 'mais' : 'more'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modals */}
        {showAddModal && (
          <LocationFormModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddLocation}
            title={language === 'pt' ? 'Nova Localização' : 'New Location'}
          />
        )}

        {editLocation && (
          <LocationFormModal
            isOpen={!!editLocation}
            onClose={() => setEditLocation(null)}
            onSubmit={(data) => handleEditLocation(editLocation.id, data)}
            location={editLocation}
            title={language === 'pt' ? 'Editar Localização' : 'Edit Location'}
          />
        )}

        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-container confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{language === 'pt' ? 'Eliminar Localização' : 'Delete Location'}</h3>
              <p>
                {language === 'pt'
                  ? `Tem certeza que deseja eliminar "${deleteConfirm.name}"?`
                  : `Are you sure you want to delete "${deleteConfirm.name}"?`
                }
              </p>
              <div className="modal-actions">
                <button className="modal-button cancel" onClick={() => setDeleteConfirm(null)}>
                  {language === 'pt' ? 'Cancelar' : 'Cancel'}
                </button>
                <button className="modal-button submit danger" onClick={() => handleDeleteLocation(deleteConfirm.id)}>
                  {language === 'pt' ? 'Eliminar' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function LocationFormModal({ isOpen, onClose, onSubmit, location, title }) {
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    name: location?.name || '',
    type: location?.type || 'warehouse',
    address: location?.address || '',
    latitude: location?.latitude || '',
    longitude: location?.longitude || '',
    contactPerson: location?.contactPerson || '',
    contactPhone: location?.contactPhone || '',
    notes: location?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const locationTypes = [
    { value: 'warehouse', label: language === 'pt' ? 'Armazém' : 'Warehouse' },
    { value: 'van', label: language === 'pt' ? 'Carrinha' : 'Van' },
    { value: 'office', label: language === 'pt' ? 'Escritório' : 'Office' },
    { value: 'workplace', label: language === 'pt' ? 'Local de Trabalho' : 'Workplace' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError(language === 'pt' ? 'Nome é obrigatório' : 'Name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      });
    } catch (err) {
      setError(err.message || (language === 'pt' ? 'Erro ao guardar' : 'Failed to save'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container location-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">{language === 'pt' ? 'Nome' : 'Name'} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder={language === 'pt' ? 'Ex: Armazém Central' : 'Ex: Central Warehouse'}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{language === 'pt' ? 'Tipo' : 'Type'}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="form-input"
            >
              {locationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{language === 'pt' ? 'Morada' : 'Address'}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input"
              placeholder={language === 'pt' ? 'Morada completa' : 'Full address'}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{language === 'pt' ? 'Latitude' : 'Latitude'}</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="form-input"
                placeholder="38.7223"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'pt' ? 'Longitude' : 'Longitude'}</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="form-input"
                placeholder="-9.1393"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{language === 'pt' ? 'Responsável' : 'Contact Person'}</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="form-input"
                placeholder={language === 'pt' ? 'Nome do responsável' : 'Person name'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'pt' ? 'Telefone' : 'Phone'}</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="form-input"
                placeholder="+351 XXX XXX XXX"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{language === 'pt' ? 'Notas' : 'Notes'}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              rows="3"
              placeholder={language === 'pt' ? 'Informações adicionais...' : 'Additional information...'}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-button cancel" onClick={onClose} disabled={loading}>
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="submit" className="modal-button submit" disabled={loading}>
              {loading ? (language === 'pt' ? 'A guardar...' : 'Saving...') : (language === 'pt' ? 'Guardar' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
