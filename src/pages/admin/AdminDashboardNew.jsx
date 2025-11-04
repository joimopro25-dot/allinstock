import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyEuroIcon,
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import './AdminDashboard.css';
import PrivacyPolicyEditor from './PrivacyPolicyEditor';

// Plans View Component
function PlansView({ plans, onBack, onSave }) {
  const [editingPlan, setEditingPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleSave = async (planData) => {
    await onSave(planData);
    setShowModal(false);
    setEditingPlan(null);
  };

  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Pricing Plans</h2>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <div className="plan-header">
              <h3>{plan.name}</h3>
              {plan.popular && <span className="badge-popular">Most Popular</span>}
            </div>
            <div className="plan-price">
              {plan.price === 0 ? (
                <span className="price-free">Free</span>
              ) : (
                <>
                  <span className="price-currency">€</span>
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-period">/month</span>
                </>
              )}
            </div>
            <div className="plan-description">
              {typeof plan.description === 'string'
                ? plan.description
                : plan.description?.en || plan.description?.pt || 'No description provided'}
            </div>
            <div className="plan-features-list">
              <h4>Features:</h4>
              <ul>
                {plan.features && (
                  <>
                    <li>{plan.features.users === -1 ? 'Unlimited' : plan.features.users} Users</li>
                    <li>{plan.features.products === -1 ? 'Unlimited' : plan.features.products} Products</li>
                    <li>{plan.features.locations === -1 ? 'Unlimited' : plan.features.locations} Locations</li>
                    <li className={plan.features.emailSupport ? 'feature-enabled' : 'feature-disabled'}>
                      Email Support
                    </li>
                    <li className={plan.features.prioritySupport ? 'feature-enabled' : 'feature-disabled'}>
                      Priority Support
                    </li>
                    <li className={plan.features.customReports ? 'feature-enabled' : 'feature-disabled'}>
                      Custom Reports
                    </li>
                  </>
                )}
              </ul>
            </div>
            <button className="btn-edit-plan" onClick={() => handleEdit(plan)}>
              <PencilIcon style={{ width: '16px', height: '16px' }} />
              Edit Plan
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <PlanModal
          plan={editingPlan}
          onClose={() => {
            setShowModal(false);
            setEditingPlan(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Plan Modal Component
function PlanModal({ plan, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || 0,
    description: typeof plan?.description === 'string'
      ? plan.description
      : plan?.description?.en || plan?.description?.pt || '',
    features: {
      users: plan?.features?.users || 1,
      products: plan?.features?.products || 50,
      locations: plan?.features?.locations || 5,
      emailSupport: plan?.features?.emailSupport || false,
      prioritySupport: plan?.features?.prioritySupport || false,
      customReports: plan?.features?.customReports || false,
    },
    popular: plan?.popular || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: plan?.id,
      ...formData,
      price: parseFloat(formData.price),
      features: {
        ...formData.features,
        users: parseInt(formData.features.users),
        products: parseInt(formData.features.products),
        locations: parseInt(formData.features.locations),
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{plan ? 'Edit Plan' : 'Create Plan'}</h2>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Plan Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., Professional"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (€/month) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="form-input"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Mark as Popular
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
              rows="3"
              placeholder="Brief description of this plan"
            />
          </div>

          <h3 style={{ color: 'white', marginTop: '1.5rem', marginBottom: '1rem' }}>Features & Limits</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Users (-1 for unlimited)</label>
              <input
                type="number"
                value={formData.features.users}
                onChange={(e) => setFormData({
                  ...formData,
                  features: { ...formData.features, users: e.target.value }
                })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Products (-1 for unlimited)</label>
              <input
                type="number"
                value={formData.features.products}
                onChange={(e) => setFormData({
                  ...formData,
                  features: { ...formData.features, products: e.target.value }
                })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Max Locations (-1 for unlimited)</label>
            <input
              type="number"
              value={formData.features.locations}
              onChange={(e) => setFormData({
                ...formData,
                features: { ...formData.features, locations: e.target.value }
              })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.features.emailSupport}
                onChange={(e) => setFormData({
                  ...formData,
                  features: { ...formData.features, emailSupport: e.target.checked }
                })}
              />
              Email Support
            </label>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.features.prioritySupport}
                onChange={(e) => setFormData({
                  ...formData,
                  features: { ...formData.features, prioritySupport: e.target.checked }
                })}
              />
              Priority Support
            </label>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.features.customReports}
                onChange={(e) => setFormData({
                  ...formData,
                  features: { ...formData.features, customReports: e.target.checked }
                })}
              />
              Custom Reports
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-button cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-button submit">
              {plan ? 'Update' : 'Create'} Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Promo Codes View Component
function PromoCodesView({ promoCodes, onBack, onSave, onDelete, onToggleActive }) {
  const [editingPromo, setEditingPromo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingPromo(null);
    setShowModal(true);
  };

  const handleSave = async (promoData) => {
    await onSave(promoData);
    setShowModal(false);
    setEditingPromo(null);
  };

  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Promo Codes</h2>
        <button className="btn-edit-plan" style={{ width: 'auto' }} onClick={handleCreate}>
          <PlusIcon style={{ width: '16px', height: '16px' }} />
          Create Promo Code
        </button>
      </div>

      <div className="promo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {promoCodes.map((promo) => (
          <div
            key={promo.id}
            className="plan-card"
            style={{ opacity: promo.active ? 1 : 0.6 }}
          >
            <div className="plan-header">
              <h3 style={{ fontSize: '1.5rem', fontFamily: 'monospace' }}>{promo.code}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleEdit(promo)}
                  style={{
                    background: 'rgba(102, 126, 234, 0.2)',
                    border: '1px solid rgba(102, 126, 234, 0.5)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PencilIcon style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
                </button>
                <button
                  onClick={() => onDelete(promo.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrashIcon style={{ width: '16px', height: '16px', color: '#fca5a5' }} />
                </button>
              </div>
            </div>

            <div className="plan-price" style={{ marginBottom: '1rem' }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {promo.type === 'percentage' && `${promo.discountValue}% OFF`}
                {promo.type === 'fixed_amount' && `€${promo.discountValue} OFF`}
                {promo.type === 'free_trial' && `${promo.discountValue} Days Free`}
              </span>
            </div>

            <div className="plan-features-list">
              <ul>
                <li>Duration: {promo.duration}</li>
                {promo.maxUses && (
                  <li>Uses: {promo.usedCount || 0}/{promo.maxUses}</li>
                )}
                {promo.expiresAt && (
                  <li>Expires: {promo.expiresAt.toDate().toLocaleDateString()}</li>
                )}
                {promo.description && (
                  <li style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {promo.description}
                  </li>
                )}
              </ul>
            </div>

            <button
              className="btn-edit-plan"
              style={{
                background: promo.active
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
              }}
              onClick={() => onToggleActive(promo)}
            >
              {promo.active ? (
                <>
                  <CheckIcon style={{ width: '16px', height: '16px' }} />
                  Active
                </>
              ) : (
                <>
                  <XMarkIcon style={{ width: '16px', height: '16px' }} />
                  Inactive
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {promoCodes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          <TagIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.125rem', margin: 0 }}>No promo codes yet. Create your first one!</p>
        </div>
      )}

      {showModal && (
        <PromoCodeModal
          promo={editingPromo}
          onClose={() => {
            setShowModal(false);
            setEditingPromo(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Promo Code Modal Component
function PromoCodeModal({ promo, onClose, onSave }) {
  const [formData, setFormData] = useState({
    code: promo?.code || '',
    type: promo?.type || 'percentage',
    discountValue: promo?.discountValue || 0,
    duration: promo?.duration || 'once',
    maxUses: promo?.maxUses || '',
    expiresAt: promo?.expiresAt ? promo.expiresAt.toDate().toISOString().split('T')[0] : '',
    description: promo?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const promoData = {
      ...(promo?.id && { id: promo.id }),
      ...formData,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      expiresAt: formData.expiresAt ? Timestamp.fromDate(new Date(formData.expiresAt)) : null,
      discountValue: parseFloat(formData.discountValue)
    };

    onSave(promoData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{promo ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="form-input"
              required
              placeholder="SUMMER2025"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="form-input"
            >
              <option value="percentage">Percentage Discount</option>
              <option value="fixed_amount">Fixed Amount</option>
              <option value="free_trial">Free Trial Days</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {formData.type === 'percentage' ? 'Percentage (%)' :
               formData.type === 'fixed_amount' ? 'Amount (€)' :
               'Days'}
              *
            </label>
            <input
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              className="form-input"
              required
              min="0"
              step={formData.type === 'percentage' || formData.type === 'free_trial' ? '1' : '0.01'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Duration *</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="form-input"
            >
              <option value="once">Once</option>
              <option value="repeating">Repeating</option>
              <option value="forever">Forever</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Uses</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="form-input"
                min="0"
                placeholder="Unlimited"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expires At</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
              rows="3"
              placeholder="Internal notes about this promo code..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-button cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-button submit">
              {promo ? 'Update' : 'Create'} Promo Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Settings View Component
function SettingsView({ onBack }) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      siteName: 'AllInStock',
      supportEmail: '',
      maintenanceMode: false,
      allowSignups: true,
    },
    payment: {
      eupagoApiKey: '',
      eupagoEnabled: false,
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: 'AllInStock',
    },
    notifications: {
      newUserRegistration: true,
      paymentFailed: true,
      trialExpiring: true,
      adminAlerts: true,
    },
    security: {
      passwordMinLength: 8,
      sessionTimeout: 30,
      requireEmailVerification: true,
      enable2FA: false,
    },
    webhooks: {
      paymentWebhookUrl: '',
      paymentWebhookSecret: '',
      userRegistrationWebhookUrl: '',
      subscriptionWebhookUrl: '',
      enableWebhooks: false,
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load all settings from Firestore
      const sections = ['general', 'payment', 'email', 'notifications', 'security', 'webhooks'];
      const loadedSettings = { ...settings };

      for (const section of sections) {
        const docRef = doc(db, 'settings', section);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          loadedSettings[section] = { ...loadedSettings[section], ...docSnap.data() };
        }
      }

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Save current tab's settings to Firestore
      await setDoc(doc(db, 'settings', activeTab), settings[activeTab], { merge: true });

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'payment', label: 'Payment' },
    { id: 'email', label: 'Email' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
    { id: 'webhooks', label: 'Webhooks' }
  ];

  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>System Settings</h2>
        <button
          className="btn-edit-plan"
          style={{ width: 'auto' }}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === tab.id ? '#667eea' : 'rgba(255, 255, 255, 0.6)',
              fontWeight: activeTab === tab.id ? '700' : '500',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="settings-content" style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '800px'
      }}>
        {/* General Settings */}
        {activeTab === 'general' && (
          <div>
            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>General Settings</h3>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Site Name</label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                className="form-input"
                placeholder="AllInStock"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Support Email</label>
              <input
                type="email"
                value={settings.general.supportEmail}
                onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                className="form-input"
                placeholder="support@allinstock.com"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.general.maintenanceMode}
                  onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
                />
                Maintenance Mode
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                When enabled, only admins can access the system
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.general.allowSignups}
                  onChange={(e) => updateSetting('general', 'allowSignups', e.target.checked)}
                />
                Allow New Signups
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Enable or disable new user registration
              </p>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div>
            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Payment Settings</h3>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.payment.eupagoEnabled}
                  onChange={(e) => updateSetting('payment', 'eupagoEnabled', e.target.checked)}
                />
                Enable Eupago Payment Gateway
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Eupago API Key</label>
              <input
                type="password"
                value={settings.payment.eupagoApiKey}
                onChange={(e) => updateSetting('payment', 'eupagoApiKey', e.target.value)}
                className="form-input"
                placeholder="Enter your Eupago API key"
              />
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Get your API key from the Eupago dashboard
              </p>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div>
            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Email Settings (SMTP)</h3>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">SMTP Host</label>
              <input
                type="text"
                value={settings.email.smtpHost}
                onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                className="form-input"
                placeholder="smtp.gmail.com"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">SMTP Port</label>
              <input
                type="number"
                value={settings.email.smtpPort}
                onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                className="form-input"
                placeholder="587"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">SMTP Username</label>
              <input
                type="text"
                value={settings.email.smtpUsername}
                onChange={(e) => updateSetting('email', 'smtpUsername', e.target.value)}
                className="form-input"
                placeholder="your-email@gmail.com"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">SMTP Password</label>
              <input
                type="password"
                value={settings.email.smtpPassword}
                onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                className="form-input"
                placeholder="Enter your SMTP password"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">From Email</label>
              <input
                type="email"
                value={settings.email.fromEmail}
                onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                className="form-input"
                placeholder="noreply@allinstock.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">From Name</label>
              <input
                type="text"
                value={settings.email.fromName}
                onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                className="form-input"
                placeholder="AllInStock"
              />
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div>
            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Email Notifications</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
              Configure which email notifications to send
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.newUserRegistration}
                  onChange={(e) => updateSetting('notifications', 'newUserRegistration', e.target.checked)}
                />
                New User Registration
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Send notification when a new user registers
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.paymentFailed}
                  onChange={(e) => updateSetting('notifications', 'paymentFailed', e.target.checked)}
                />
                Payment Failed
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Notify users when their payment fails
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.trialExpiring}
                  onChange={(e) => updateSetting('notifications', 'trialExpiring', e.target.checked)}
                />
                Trial Expiring
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Remind users when their trial is about to expire
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.adminAlerts}
                  onChange={(e) => updateSetting('notifications', 'adminAlerts', e.target.checked)}
                />
                Admin Alerts
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Receive admin notifications for system events
              </p>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div>
            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Security Settings</h3>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password Minimum Length</label>
              <input
                type="number"
                value={settings.security.passwordMinLength}
                onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                className="form-input"
                min="6"
                max="32"
              />
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Minimum number of characters required for passwords
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                className="form-input"
                min="5"
                max="1440"
              />
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Auto-logout users after this many minutes of inactivity
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.security.requireEmailVerification}
                  onChange={(e) => updateSetting('security', 'requireEmailVerification', e.target.checked)}
                />
                Require Email Verification
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Users must verify their email before accessing the system
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.security.enable2FA}
                  onChange={(e) => updateSetting('security', 'enable2FA', e.target.checked)}
                />
                Enable Two-Factor Authentication (2FA)
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Allow users to enable 2FA for enhanced security
              </p>
            </div>
          </div>
        )}

        {/* Webhooks Settings */}
        {activeTab === 'webhooks' && (
          <div>
            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Webhook Configuration</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
              Configure webhooks to receive real-time notifications about events in your system
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.webhooks.enableWebhooks}
                  onChange={(e) => updateSetting('webhooks', 'enableWebhooks', e.target.checked)}
                />
                Enable Webhooks
              </label>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Turn on webhook notifications for external integrations
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Payment Webhook URL</label>
              <input
                type="url"
                value={settings.webhooks.paymentWebhookUrl}
                onChange={(e) => updateSetting('webhooks', 'paymentWebhookUrl', e.target.value)}
                className="form-input"
                placeholder="https://your-domain.com/webhooks/payment"
              />
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Receive notifications for payment events (success, failure, refund)
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Payment Webhook Secret</label>
              <input
                type="password"
                value={settings.webhooks.paymentWebhookSecret}
                onChange={(e) => updateSetting('webhooks', 'paymentWebhookSecret', e.target.value)}
                className="form-input"
                placeholder="Enter webhook signing secret"
              />
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Secret key to verify webhook authenticity
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">User Registration Webhook URL</label>
              <input
                type="url"
                value={settings.webhooks.userRegistrationWebhookUrl}
                onChange={(e) => updateSetting('webhooks', 'userRegistrationWebhookUrl', e.target.value)}
                className="form-input"
                placeholder="https://your-domain.com/webhooks/user-registration"
              />
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Receive notifications when new users register
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Subscription Webhook URL</label>
              <input
                type="url"
                value={settings.webhooks.subscriptionWebhookUrl}
                onChange={(e) => updateSetting('webhooks', 'subscriptionWebhookUrl', e.target.value)}
                className="form-input"
                placeholder="https://your-domain.com/webhooks/subscription"
              />
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Receive notifications for subscription changes (created, updated, cancelled)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Subscriptions View Component
function SubscriptionsView({ companies, onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Calculate subscription statistics
  const subscriptions = companies.map(company => ({
    id: company.id,
    user: company.name || 'Unknown',
    email: company.email || 'N/A',
    plan: company.plan || 'free',
    cycle: company.billingCycle || 'monthly',
    status: company.subscriptionStatus || 'active',
    startDate: company.subscriptionStartDate,
    nextBilling: company.nextBillingDate,
  }));

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trial: subscriptions.filter(s => s.status === 'trial').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <h2 style={{ color: 'white', marginBottom: '2rem' }}>Subscriptions</h2>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>
            {stats.total}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Total
          </div>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '0.5rem'
          }}>
            {stats.active}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Active
          </div>
        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#f59e0b',
            marginBottom: '0.5rem'
          }}>
            {stats.trial}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Trial
          </div>
        </div>

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#ef4444',
            marginBottom: '0.5rem'
          }}>
            {stats.cancelled}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Cancelled
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ flex: '1 1 300px' }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ flex: '0 1 150px' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="form-input"
          style={{ flex: '0 1 150px' }}
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                USER
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                PLAN
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                CYCLE
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ color: 'white', fontWeight: '600' }}>{sub.user}</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>{sub.email}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    background: sub.plan === 'free' ? 'rgba(107, 114, 128, 0.2)' :
                               sub.plan === 'starter' ? 'rgba(59, 130, 246, 0.2)' :
                               sub.plan === 'professional' ? 'rgba(168, 85, 247, 0.2)' :
                               'rgba(245, 158, 11, 0.2)',
                    color: sub.plan === 'free' ? '#9ca3af' :
                          sub.plan === 'starter' ? '#60a5fa' :
                          sub.plan === 'professional' ? '#c084fc' :
                          '#fbbf24'
                  }}>
                    {sub.plan.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    background: sub.status === 'active' ? 'rgba(16, 185, 129, 0.2)' :
                               sub.status === 'trial' ? 'rgba(245, 158, 11, 0.2)' :
                               'rgba(239, 68, 68, 0.2)',
                    color: sub.status === 'active' ? '#10b981' :
                          sub.status === 'trial' ? '#f59e0b' :
                          '#ef4444'
                  }}>
                    {sub.status === 'active' && <CheckIcon style={{ width: '14px', height: '14px' }} />}
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSubscriptions.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <p style={{ margin: 0, fontSize: '1.125rem' }}>No subscriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Payments View Component
function PaymentsView({ onBack }) {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // Load payments from Firestore
      const paymentsRef = collection(db, 'payments');
      const snapshot = await getDocs(paymentsRef);
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate() || new Date(),
      }));

      // Sort by date descending
      paymentsData.sort((a, b) => b.date - a.date);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'paid' || p.status === 'succeeded').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalRevenue: payments
      .filter(p => p.status === 'paid' || p.status === 'succeeded')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      (payment.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Cliente', 'Método', 'Plano', 'Montante', 'Status'];
    const csvData = filteredPayments.map(p => [
      p.date.toLocaleDateString('pt-PT'),
      p.clientName || '-',
      p.method || '-',
      p.plan || '-',
      `€${(p.amount || 0).toFixed(2)}`,
      p.status || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <h2 style={{ color: 'white', marginBottom: '2rem' }}>Payments</h2>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>
            {stats.total}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Total
          </div>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '0.5rem'
          }}>
            {stats.paid}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Pagos
          </div>
        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#f59e0b',
            marginBottom: '0.5rem'
          }}>
            {stats.pending}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Pendentes
          </div>
        </div>

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#ef4444',
            marginBottom: '0.5rem'
          }}>
            {stats.failed}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Falhados
          </div>
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: '#3b82f6',
            marginBottom: '0.5rem'
          }}>
            €{stats.totalRevenue.toFixed(2)}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>
            Receita Total
          </div>
        </div>
      </div>

      {/* Search, Filters and Export */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Pesquisar por email ou referência..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ flex: '1 1 300px' }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ flex: '0 1 150px' }}
        >
          <option value="all">Todos os status</option>
          <option value="paid">Pago</option>
          <option value="succeeded">Sucesso</option>
          <option value="pending">Pendente</option>
          <option value="failed">Falhado</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="form-input"
          style={{ flex: '0 1 150px' }}
        >
          <option value="all">Todos os métodos</option>
          <option value="GooglePay">GooglePay</option>
          <option value="CreditCard">CreditCard</option>
          <option value="MBWay">MBWay</option>
          <option value="Stripe">Stripe</option>
          <option value="Eupago">Eupago</option>
        </select>

        <button
          onClick={handleExportCSV}
          className="btn-edit-plan"
          style={{ width: 'auto', flex: '0 1 auto' }}
        >
          <DocumentTextIcon style={{ width: '16px', height: '16px' }} />
          Exportar CSV
        </button>
      </div>

      {/* Payments Table */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <p style={{ margin: 0, fontSize: '1.125rem' }}>Loading payments...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                  DATA
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                  CLIENTE
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                  MÉTODO
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                  PLANO
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.875rem' }}>
                  MONTANTE
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ color: 'white', fontWeight: '600' }}>
                      {payment.date.toLocaleDateString('pt-PT')}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                      {payment.date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ color: 'white', fontWeight: '600' }}>
                      {payment.clientName || '-'}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                      {payment.clientEmail || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {payment.method || '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      background: payment.plan === 'Rookie' ? 'rgba(59, 130, 246, 0.2)' :
                                 payment.plan === 'Professional' ? 'rgba(168, 85, 247, 0.2)' :
                                 payment.plan === 'Enterprise' ? 'rgba(245, 158, 11, 0.2)' :
                                 'rgba(107, 114, 128, 0.2)',
                      color: payment.plan === 'Rookie' ? '#60a5fa' :
                            payment.plan === 'Professional' ? '#c084fc' :
                            payment.plan === 'Enterprise' ? '#fbbf24' :
                            '#9ca3af'
                    }}>
                      {payment.plan || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>
                      €{(payment.amount || 0).toFixed(2)}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: (payment.status === 'paid' || payment.status === 'succeeded') ? 'rgba(16, 185, 129, 0.2)' :
                                   payment.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' :
                                   'rgba(239, 68, 68, 0.2)',
                        color: (payment.status === 'paid' || payment.status === 'succeeded') ? '#10b981' :
                              payment.status === 'pending' ? '#f59e0b' :
                              '#ef4444'
                      }}>
                        {payment.status === 'paid' || payment.status === 'succeeded' ? 'Pago' :
                         payment.status === 'pending' ? 'Pendente' :
                         payment.status === 'failed' ? 'Falhado' :
                         payment.status || '-'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredPayments.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <p style={{ margin: 0, fontSize: '1.125rem' }}>No payments found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardNew() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // Data states
  const [companies, setCompanies] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalCompanies: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    newCompaniesThisMonth: 0
  });

  // View states
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, companies, plans, promos, payments

  // Load functions
  const loadCompanies = async () => {
    const snapshot = await getDocs(collection(db, 'companies'));
    const companiesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCompanies(companiesData);
  };

  const loadPromoCodes = async () => {
    const snapshot = await getDocs(collection(db, 'promoCodes'));
    const promoData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPromoCodes(promoData);
  };

  const loadPlans = async () => {
    // Always load default plans from config
    const { PLANS } = await import('../../config/plans');
    const defaultPlans = Object.values(PLANS).map(plan => ({
      id: plan.id,
      ...plan
    }));

    // Load any overrides from Firestore
    const snapshot = await getDocs(collection(db, 'plans'));
    const firestorePlans = {};
    snapshot.docs.forEach(doc => {
      firestorePlans[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });

    // Merge: use Firestore data if available, otherwise use defaults
    const mergedPlans = defaultPlans.map(defaultPlan =>
      firestorePlans[defaultPlan.id] || defaultPlan
    );

    setPlans(mergedPlans);
  };

  const loadPaymentSettings = async () => {
    const docRef = doc(db, 'settings', 'payments');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setPaymentSettings(docSnap.data());
    } else {
      setPaymentSettings({
        stripePublicKey: '',
        stripeSecretKey: '',
        paypalClientId: '',
        currency: 'EUR'
      });
    }
  };

  const loadAnalytics = async () => {
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const companiesList = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newThisMonth = companiesList.filter(c => {
      if (!c.createdAt) return false;
      const createdDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return createdDate >= firstDayOfMonth;
    }).length;

    const activeSubscriptions = companiesList.filter(c =>
      c.plan && c.plan !== 'free' && c.subscriptionStatus === 'active'
    ).length;

    const totalRevenue = companiesList.reduce((sum, c) => {
      if (c.plan && c.subscriptionStatus === 'active') {
        const planPrices = { starter: 10, professional: 15, enterprise: 25 };
        return sum + (planPrices[c.plan] || 0);
      }
      return sum;
    }, 0);

    setAnalytics({
      totalCompanies: companiesList.length,
      activeSubscriptions,
      totalRevenue,
      newCompaniesThisMonth: newThisMonth
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCompanies(),
        loadPromoCodes(),
        loadPlans(),
        loadPaymentSettings(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUserRole = async () => {
      if (!currentUser) {
        navigate('/dashboard');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          navigate('/dashboard');
          return;
        }

        const userData = userDocSnap.data();

        if (userData?.role !== 'super_admin') {
          navigate('/dashboard');
          return;
        }

        setUserRole(userData.role);
        setCheckingRole(false);
        await loadData();
      } catch (error) {
        console.error('Error checking user role:', error);
        navigate('/dashboard');
      }
    };

    checkUserRole();
  }, [currentUser, navigate]);

  const handleSavePromoCode = async (promoData) => {
    try {
      if (promoData.id) {
        await updateDoc(doc(db, 'promoCodes', promoData.id), {
          ...promoData,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'promoCodes'), {
          ...promoData,
          active: true,
          usedCount: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      await loadPromoCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      alert('Failed to save promo code. Please try again.');
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await deleteDoc(doc(db, 'promoCodes', promoId));
      await loadPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('Failed to delete promo code. Please try again.');
    }
  };

  const handleTogglePromoActive = async (promo) => {
    try {
      await updateDoc(doc(db, 'promoCodes', promo.id), {
        active: !promo.active,
        updatedAt: Timestamp.now()
      });
      await loadPromoCodes();
    } catch (error) {
      console.error('Error toggling promo code:', error);
      alert('Failed to toggle promo code. Please try again.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (checkingRole) {
    return (
      <div className="admin-dashboard-standalone">
        <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>
          <ShieldCheckIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
          <h2>Checking permissions...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-standalone">
      {/* Admin Navigation Bar */}
      <div className="admin-navbar">
        <div className="admin-navbar-left">
          <ShieldCheckIcon className="admin-logo-icon" />
          <h1 className="admin-logo-text">AllInStock Admin</h1>
        </div>
        <div className="admin-navbar-right">
          <button className="btn-back-to-app" onClick={() => navigate('/dashboard')}>
            Back to App
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <ArrowLeftOnRectangleIcon style={{ width: '20px', height: '20px' }} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {activeView === 'dashboard' && (
          <>
            {/* Header */}
            <div className="admin-header-simple">
              <h1 className="admin-title">Super Admin Dashboard</h1>
              <p className="admin-subtitle">Manage your SaaS platform</p>
            </div>

            {/* Analytics Cards */}
            <div className="analytics-grid">
              <div className="stat-card">
                <div className="stat-icon companies">
                  <BuildingOfficeIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Companies</div>
                  <div className="stat-value">{analytics.totalCompanies}</div>
                  <div className="stat-change">+{analytics.newCompaniesThisMonth} this month</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon subscriptions">
                  <UsersIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Active Subscriptions</div>
                  <div className="stat-value">{analytics.activeSubscriptions}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon revenue">
                  <CurrencyEuroIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Monthly Revenue</div>
                  <div className="stat-value">€{analytics.totalRevenue.toFixed(2)}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon promos">
                  <TagIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Active Promo Codes</div>
                  <div className="stat-value">{promoCodes.filter(p => p.active).length}</div>
                </div>
              </div>
            </div>

            {/* Management Cards */}
            <div className="management-grid">
              <div className="management-card" onClick={() => setActiveView('subscriptions')}>
                <div className="management-card-icon">
                  <UsersIcon />
                </div>
                <h3>Subscriptions</h3>
                <p>Manage user subscriptions and billing</p>
                <div className="management-card-stat">{companies.length} subscriptions</div>
              </div>

              <div className="management-card" onClick={() => setActiveView('plans')}>
                <div className="management-card-icon">
                  <DocumentTextIcon />
                </div>
                <h3>Pricing Plans</h3>
                <p>Edit plan descriptions, features, and prices</p>
                <div className="management-card-stat">{plans.length} plans</div>
              </div>

              <div className="management-card" onClick={() => setActiveView('promos')}>
                <div className="management-card-icon">
                  <TagIcon />
                </div>
                <h3>Promo Codes</h3>
                <p>Create and manage promotional discount codes</p>
                <div className="management-card-stat">{promoCodes.length} codes</div>
              </div>

              <div className="management-card" onClick={() => setActiveView('payments')}>
                <div className="management-card-icon">
                  <CreditCardIcon />
                </div>
                <h3>Payments</h3>
                <p>View and manage all payment transactions</p>
                <div className="management-card-stat">View all</div>
              </div>

              <div className="management-card" onClick={() => setActiveView('settings')}>
                <div className="management-card-icon">
                  <Cog6ToothIcon />
                </div>
                <h3>System Settings</h3>
                <p>Configure general, email, security, and notification settings</p>
                <div className="management-card-stat">Configure</div>
              </div>

              <div className="management-card" onClick={() => setActiveView('privacyPolicy')}>
                <div className="management-card-icon">
                  <DocumentTextIcon />
                </div>
                <h3>Privacy Policy</h3>
                <p>Edit and publish the privacy policy for your application</p>
                <div className="management-card-stat">Edit</div>
              </div>
            </div>
          </>
        )}

        {/* Plans View */}
        {activeView === 'plans' && (
          <PlansView
            plans={plans}
            onBack={() => setActiveView('dashboard')}
            onSave={async (planData) => {
              // Save plan to Firestore
              try {
                const { id, ...dataToSave } = planData;
                if (id) {
                  // Use setDoc with merge to create or update
                  await setDoc(doc(db, 'plans', id), dataToSave, { merge: true });
                } else {
                  // Create new plan with auto-generated ID
                  await addDoc(collection(db, 'plans'), dataToSave);
                }
                await loadPlans();
              } catch (error) {
                console.error('Error saving plan:', error);
                alert('Failed to save plan. Please try again.');
              }
            }}
          />
        )}

        {/* Promo Codes View */}
        {activeView === 'promos' && (
          <PromoCodesView
            promoCodes={promoCodes}
            onBack={() => setActiveView('dashboard')}
            onSave={handleSavePromoCode}
            onDelete={handleDeletePromo}
            onToggleActive={handleTogglePromoActive}
          />
        )}

        {/* Settings View */}
        {activeView === 'settings' && (
          <SettingsView
            onBack={() => setActiveView('dashboard')}
          />
        )}

        {/* Subscriptions View */}
        {activeView === 'subscriptions' && (
          <SubscriptionsView
            companies={companies}
            onBack={() => setActiveView('dashboard')}
          />
        )}

        {/* Payments View */}
        {activeView === 'payments' && (
          <PaymentsView
            onBack={() => setActiveView('dashboard')}
          />
        )}

        {/* Privacy Policy View */}
        {activeView === 'privacyPolicy' && (
          <PrivacyPolicyEditor
            onBack={() => setActiveView('dashboard')}
          />
        )}

        {/* Other views */}
        {(activeView !== 'dashboard' && activeView !== 'plans' && activeView !== 'promos' && activeView !== 'settings' && activeView !== 'subscriptions' && activeView !== 'payments' && activeView !== 'privacyPolicy') && (
          <div className="view-container">
            <button className="btn-back" onClick={() => setActiveView('dashboard')}>
              ← Back to Dashboard
            </button>
            <h2>{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h2>
            <p>This view is under construction...</p>
          </div>
        )}
      </div>
    </div>
  );
}
