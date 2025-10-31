import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { productService } from '../../services/productService';
import {
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  UserIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import './StockLocations.css';

export function StockLocationsModal({ isOpen, onClose, product, onUpdate }) {
  const { company, currentUser } = useAuth();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isOpen && product) {
      loadLocations();
    }
  }, [isOpen, product]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await productService.getStockLocations(company.id, product.id);
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (locationData) => {
    try {
      await productService.addStockLocation(company.id, product.id, locationData, currentUser?.email);
      await loadLocations();
      onUpdate();
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add location:', err);
      throw err;
    }
  };

  const handleEditLocation = async (locationId, locationData) => {
    try {
      await productService.updateStockLocation(company.id, product.id, locationId, locationData, currentUser?.email);
      await loadLocations();
      onUpdate();
      setEditLocation(null);
    } catch (err) {
      console.error('Failed to update location:', err);
      throw err;
    }
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      await productService.deleteStockLocation(company.id, product.id, locationId, currentUser?.email);
      await loadLocations();
      onUpdate();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete location:', err);
    }
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'warehouse':
        return <BuildingStorefrontIcon className="location-type-icon" />;
      case 'customer':
        return <UserIcon className="location-type-icon" />;
      case 'transit':
        return <TruckIcon className="location-type-icon" />;
      default:
        return <MapPinIcon className="location-type-icon" />;
    }
  };

  const getLocationTypeLabel = (type) => {
    const labels = {
      warehouse: language === 'pt' ? 'Armazém' : 'Warehouse',
      customer: language === 'pt' ? 'Cliente' : 'Customer',
      transit: language === 'pt' ? 'Em Trânsito' : 'In Transit'
    };
    return labels[type] || type;
  };

  const totalStock = locations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container locations-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="modal-title">{t('stockLocations')}</h2>
              <p className="modal-subtitle">{product?.name}</p>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="locations-summary">
            <div className="summary-item">
              <span className="summary-label">{t('totalStock')}:</span>
              <span className="summary-value">{totalStock} {product?.unit}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t('location')}s:</span>
              <span className="summary-value">{locations.length}</span>
            </div>
          </div>

          <div className="locations-content">
            {loading ? (
              <div className="loading-state">{t('loading')}</div>
            ) : locations.length === 0 ? (
              <div className="empty-state">
                <MapPinIcon className="empty-icon" />
                <p>{language === 'pt' ? 'Nenhuma localização encontrada' : 'No locations found'}</p>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                  <PlusIcon className="btn-icon" />
                  {t('addLocation')}
                </button>
              </div>
            ) : (
              <>
                <div className="locations-list">
                  {locations.map((location) => (
                    <div key={location.id} className="location-card">
                      <div className="location-header">
                        {getLocationIcon(location.type)}
                        <div className="location-info">
                          <h4 className="location-name">
                            {location.name}
                            {location.isMain && (
                              <span className="main-badge">
                                {language === 'pt' ? 'Principal' : 'Main'}
                              </span>
                            )}
                          </h4>
                          <span className="location-type">
                            {getLocationTypeLabel(location.type)}
                          </span>
                        </div>
                      </div>
                      <div className="location-body">
                        <div className="location-quantity">
                          <span className="quantity-value">{location.quantity}</span>
                          <span className="quantity-unit">{product?.unit}</span>
                        </div>
                        <div className="location-actions">
                          <button
                            className="action-btn edit"
                            onClick={() => setEditLocation(location)}
                            title={t('edit')}
                          >
                            <PencilIcon className="action-icon" />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteConfirm(location)}
                            title={t('delete')}
                          >
                            <TrashIcon className="action-icon" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-add-location"
                  onClick={() => setShowAddModal(true)}
                >
                  <PlusIcon className="btn-icon" />
                  {t('addLocation')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddLocationModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddLocation}
          product={product}
        />
      )}

      {editLocation && (
        <EditLocationModal
          isOpen={!!editLocation}
          onClose={() => setEditLocation(null)}
          onSubmit={(data) => handleEditLocation(editLocation.id, data)}
          location={editLocation}
          product={product}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-container confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('deleteProduct')}</h3>
            <p>
              {language === 'pt'
                ? `Tem certeza que deseja eliminar a localização "${deleteConfirm.name}"?`
                : `Are you sure you want to delete the location "${deleteConfirm.name}"?`
              }
            </p>
            {deleteConfirm.quantity > 0 && (
              <p className="warning-text">
                {language === 'pt'
                  ? `Esta localização tem ${deleteConfirm.quantity} ${product?.unit} em stock!`
                  : `This location has ${deleteConfirm.quantity} ${product?.unit} in stock!`
                }
              </p>
            )}
            <div className="modal-actions">
              <button
                className="modal-button cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                {t('cancel')}
              </button>
              <button
                className="modal-button submit danger"
                onClick={() => handleDeleteLocation(deleteConfirm.id)}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AddLocationModal({ isOpen, onClose, onSubmit, product }) {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [formData, setFormData] = useState({
    name: '',
    type: 'warehouse',
    quantity: '',
    isMain: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const locationTypes = [
    { value: 'warehouse', label: t('warehouse') },
    { value: 'customer', label: t('customer') },
    { value: 'transit', label: t('transit') }
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
        name: formData.name.trim(),
        type: formData.type,
        quantity: parseInt(formData.quantity) || 0,
        isMain: formData.isMain
      });
      setFormData({ name: '', type: 'warehouse', quantity: '', isMain: false });
    } catch (err) {
      setError(language === 'pt' ? 'Erro ao adicionar localização' : 'Failed to add location');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('addLocation')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">{language === 'pt' ? 'Nome da Localização' : 'Location Name'} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder={language === 'pt' ? 'Ex: Armazém Norte' : 'Ex: North Warehouse'}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('type')}</label>
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
              <label className="form-label">{t('quantity')}</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="form-input"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-button cancel" onClick={onClose} disabled={loading}>
              {t('cancel')}
            </button>
            <button type="submit" className="modal-button submit" disabled={loading}>
              {loading ? (language === 'pt' ? 'Adicionando...' : 'Adding...') : t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditLocationModal({ isOpen, onClose, onSubmit, location, product }) {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [formData, setFormData] = useState({
    name: location?.name || '',
    type: location?.type || 'warehouse',
    quantity: location?.quantity || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const locationTypes = [
    { value: 'warehouse', label: t('warehouse') },
    { value: 'customer', label: t('customer') },
    { value: 'transit', label: t('transit') }
  ];

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        type: location.type || 'warehouse',
        quantity: location.quantity || ''
      });
    }
  }, [location]);

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
        name: formData.name.trim(),
        type: formData.type,
        quantity: parseInt(formData.quantity) || 0
      });
    } catch (err) {
      setError(language === 'pt' ? 'Erro ao atualizar localização' : 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('edit')} {t('location')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">{language === 'pt' ? 'Nome da Localização' : 'Location Name'} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('type')}</label>
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
              <label className="form-label">{t('quantity')}</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="form-input"
                min="0"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-button cancel" onClick={onClose} disabled={loading}>
              {t('cancel')}
            </button>
            <button type="submit" className="modal-button submit" disabled={loading}>
              {loading ? (language === 'pt' ? 'Atualizando...' : 'Updating...') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
