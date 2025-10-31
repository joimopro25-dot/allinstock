import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { productService } from '../../services/productService';
import {
  ClockIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  WrenchScrewdriverIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import './StockMovements.css';

export function StockMovementsModal({ isOpen, onClose, product }) {
  const { company } = useAuth();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, entry, exit, transfer, adjustment

  useEffect(() => {
    if (isOpen && product) {
      loadMovements();
    }
  }, [isOpen, product]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await productService.getStockMovements(company.id, product.id);
      setMovements(data);
    } catch (err) {
      console.error('Failed to load movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'entry':
        return <ArrowDownTrayIcon className="movement-icon entry" />;
      case 'exit':
        return <ArrowUpTrayIcon className="movement-icon exit" />;
      case 'transfer':
        return <ArrowsRightLeftIcon className="movement-icon transfer" />;
      case 'adjustment':
        return <WrenchScrewdriverIcon className="movement-icon adjustment" />;
      default:
        return <ClockIcon className="movement-icon" />;
    }
  };

  const getMovementTypeLabel = (type) => {
    const labels = {
      entry: language === 'pt' ? 'Entrada' : 'Entry',
      exit: language === 'pt' ? 'Saída' : 'Exit',
      transfer: language === 'pt' ? 'Transferência' : 'Transfer',
      adjustment: language === 'pt' ? 'Ajuste' : 'Adjustment'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString(language === 'pt' ? 'pt-PT' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isToday) {
      return `${language === 'pt' ? 'Hoje' : 'Today'} ${timeStr}`;
    } else if (isYesterday) {
      return `${language === 'pt' ? 'Ontem' : 'Yesterday'} ${timeStr}`;
    } else {
      return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const filteredMovements = filter === 'all'
    ? movements
    : movements.filter(m => m.type === filter);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container movements-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {language === 'pt' ? 'Histórico de Movimentos' : 'Stock Movement History'}
            </h2>
            <p className="modal-subtitle">{product?.name}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="movements-filters">
          <FunnelIcon className="filter-icon" />
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {language === 'pt' ? 'Todos' : 'All'}
          </button>
          <button
            className={`filter-btn ${filter === 'entry' ? 'active' : ''}`}
            onClick={() => setFilter('entry')}
          >
            {language === 'pt' ? 'Entradas' : 'Entries'}
          </button>
          <button
            className={`filter-btn ${filter === 'exit' ? 'active' : ''}`}
            onClick={() => setFilter('exit')}
          >
            {language === 'pt' ? 'Saídas' : 'Exits'}
          </button>
          <button
            className={`filter-btn ${filter === 'transfer' ? 'active' : ''}`}
            onClick={() => setFilter('transfer')}
          >
            {language === 'pt' ? 'Transferências' : 'Transfers'}
          </button>
        </div>

        <div className="movements-content">
          {loading ? (
            <div className="loading-state">{t('loading')}</div>
          ) : filteredMovements.length === 0 ? (
            <div className="empty-state">
              <ClockIcon className="empty-icon" />
              <p>{language === 'pt' ? 'Nenhum movimento encontrado' : 'No movements found'}</p>
            </div>
          ) : (
            <div className="movements-timeline">
              {filteredMovements.map((movement) => (
                <div key={movement.id} className={`movement-item ${movement.type}`}>
                  <div className="movement-indicator">
                    {getMovementIcon(movement.type)}
                  </div>
                  <div className="movement-content">
                    <div className="movement-header">
                      <div className="movement-type-badge">
                        {getMovementTypeLabel(movement.type)}
                      </div>
                      <div className="movement-quantity">
                        <span className={`quantity-sign ${movement.type === 'entry' ? 'positive' : movement.type === 'exit' ? 'negative' : 'neutral'}`}>
                          {movement.type === 'entry' ? '+' : movement.type === 'exit' ? '-' : ''}
                          {movement.quantity}
                        </span>
                        <span className="quantity-unit">{product?.unit}</span>
                      </div>
                    </div>

                    <div className="movement-details">
                      {movement.type === 'transfer' ? (
                        <p className="movement-description">
                          <span className="location-name">{movement.fromLocationName}</span>
                          {' → '}
                          <span className="location-name">{movement.toLocationName}</span>
                        </p>
                      ) : (
                        <p className="movement-description">
                          <span className="location-name">{movement.locationName}</span>
                        </p>
                      )}

                      {movement.notes && (
                        <p className="movement-notes">{movement.notes}</p>
                      )}

                      <div className="movement-meta">
                        <span className="movement-time">{formatDate(movement.createdAt)}</span>
                        {movement.user && (
                          <>
                            <span className="meta-separator">•</span>
                            <span className="movement-user">{movement.user}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="movements-summary">
          <div className="summary-stat">
            <span className="stat-label">{language === 'pt' ? 'Total de Movimentos' : 'Total Movements'}:</span>
            <span className="stat-value">{filteredMovements.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
