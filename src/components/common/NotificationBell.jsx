import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './NotificationBell.css';

export function NotificationBell() {
  const { company } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (company?.id) {
      loadNotifications();
      // Refresh notifications every 5 minutes
      const interval = setInterval(loadNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [company?.id]);

  const loadNotifications = async () => {
    try {
      const notifs = [];

      // Check for low stock products
      const productsSnapshot = await getDocs(collection(db, 'companies', company.id, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      products.forEach(product => {
        if ((product.stock || 0) <= (product.minStock || 0) && product.minStock > 0) {
          notifs.push({
            id: `low-stock-${product.id}`,
            type: 'low-stock',
            title: language === 'pt' ? 'Stock Baixo' : 'Low Stock',
            message: `${product.name} (${product.stock || 0}/${product.minStock})`,
            productId: product.id,
            timestamp: new Date(),
            severity: 'warning'
          });
        }
      });

      // Check for expired quotations (optional - add validUntil check)
      const quotationsSnapshot = await getDocs(
        query(
          collection(db, 'companies', company.id, 'quotations'),
          where('status', '==', 'sent')
        )
      );

      quotationsSnapshot.docs.forEach(doc => {
        const quotation = doc.data();
        if (quotation.validUntil) {
          const validDate = new Date(quotation.validUntil);
          const daysUntilExpiry = Math.ceil((validDate - new Date()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
            notifs.push({
              id: `expiring-quotation-${doc.id}`,
              type: 'expiring-quotation',
              title: language === 'pt' ? 'Orçamento a Expirar' : 'Expiring Quotation',
              message: `${quotation.clientName} - ${daysUntilExpiry} ${language === 'pt' ? 'dias' : 'days'}`,
              quotationId: doc.id,
              timestamp: validDate,
              severity: 'info'
            });
          }
        }
      });

      // Sort by severity and timestamp
      notifs.sort((a, b) => {
        const severityOrder = { warning: 0, info: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.timestamp - a.timestamp;
      });

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'low-stock') {
      navigate('/stock');
    } else if (notification.type === 'expiring-quotation') {
      navigate(`/quotations/${notification.quotationId}`);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'low-stock':
        return <ExclamationTriangleIcon className="notification-icon warning" />;
      case 'expiring-quotation':
        return <DocumentTextIcon className="notification-icon info" />;
      default:
        return <BellIcon className="notification-icon" />;
    }
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>
                {language === 'pt' ? 'Notificações' : 'Notifications'}
                {unreadCount > 0 && <span className="count">({unreadCount})</span>}
              </h3>
              <button onClick={() => setIsOpen(false)} className="close-button">
                <XMarkIcon />
              </button>
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-notifications">
                  <BellIcon className="empty-icon" />
                  <p>{language === 'pt' ? 'Sem notificações' : 'No notifications'}</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.severity}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-footer">
                <button onClick={() => { navigate('/stock'); setIsOpen(false); }}>
                  {language === 'pt' ? 'Ver Stock' : 'View Stock'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
