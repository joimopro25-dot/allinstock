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
  query,
  orderBy,
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
  XMarkIcon,
  CheckIcon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // Data states
  const [companies, setCompanies] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalCompanies: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    newCompaniesThisMonth: 0
  });

  // Modal/View states
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showCompaniesView, setShowCompaniesView] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);

  // Load functions defined before useEffect
  const loadCompanies = async () => {
    console.log('Loading companies...');
    const snapshot = await getDocs(collection(db, 'companies'));
    const companiesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Companies loaded:', companiesData.length);
    setCompanies(companiesData);
  };

  const loadPromoCodes = async () => {
    console.log('Loading promo codes...');
    const q = query(collection(db, 'promoCodes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const promoData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Promo codes loaded:', promoData.length);
    setPromoCodes(promoData);
  };

  const loadPlans = async () => {
    console.log('Loading plans...');
    // Load plans from Firestore or use default plans from config
    const snapshot = await getDocs(collection(db, 'plans'));
    if (snapshot.empty) {
      // Use default plans from config
      const { PLANS } = await import('../../config/plans');
      const defaultPlans = Object.values(PLANS).map(plan => ({
        id: plan.id,
        ...plan
      }));
      setPlans(defaultPlans);
    } else {
      const plansData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlans(plansData);
    }
    console.log('Plans loaded:', plans.length);
  };

  const loadAnalytics = async () => {
    console.log('Loading analytics...');
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const companiesList = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newThisMonth = companiesList.filter(c => {
      if (!c.createdAt) return false;
      // Handle both Firestore Timestamp and ISO string dates
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
    console.log('Analytics loaded');
  };

  // Main data loading function
  const loadData = async () => {
    try {
      console.log('Starting to load all data...');
      setLoading(true);
      await Promise.all([
        loadCompanies(),
        loadPromoCodes(),
        loadPlans(),
        loadAnalytics()
      ]);
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check user role on mount
  useEffect(() => {
    const checkUserRole = async () => {
      if (!currentUser) {
        console.log('No user found, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }

      try {
        console.log('Checking role for user:', currentUser.uid);
        // Fetch user role from Firestore - get specific user document
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.log('User document does not exist in Firestore');
          navigate('/dashboard');
          return;
        }

        const userData = userDocSnap.data();
        console.log('User data:', userData);

        if (userData?.role !== 'super_admin') {
          console.log('User is not super admin, role:', userData?.role);
          navigate('/dashboard');
          return;
        }

        console.log('User is super admin, loading data...');
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
      if (editingPromo) {
        await updateDoc(doc(db, 'promoCodes', editingPromo.id), {
          ...promoData,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'promoCodes'), {
          ...promoData,
          code: promoData.code.toUpperCase(),
          usedCount: 0,
          active: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }

      await loadPromoCodes();
      setShowPromoModal(false);
      setEditingPromo(null);
    } catch (error) {
      console.error('Error saving promo code:', error);
      alert('Error saving promo code');
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await deleteDoc(doc(db, 'promoCodes', promoId));
      await loadPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('Error deleting promo code');
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
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Super Admin Dashboard</h1>
            <p className="admin-subtitle">Manage all companies and system settings</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <ChartBarIcon className="tab-icon" />
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            <BuildingOfficeIcon className="tab-icon" />
            Companies ({companies.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'promo-codes' ? 'active' : ''}`}
            onClick={() => setActiveTab('promo-codes')}
          >
            <TagIcon className="tab-icon" />
            Promo Codes ({promoCodes.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="admin-content">
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-icon companies">
                  <BuildingOfficeIcon />
                </div>
                <div className="analytics-data">
                  <div className="analytics-label">Total Companies</div>
                  <div className="analytics-value">{analytics.totalCompanies}</div>
                  <div className="analytics-change">+{analytics.newCompaniesThisMonth} this month</div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-icon subscriptions">
                  <UsersIcon />
                </div>
                <div className="analytics-data">
                  <div className="analytics-label">Active Subscriptions</div>
                  <div className="analytics-value">{analytics.activeSubscriptions}</div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-icon revenue">
                  <CurrencyEuroIcon />
                </div>
                <div className="analytics-data">
                  <div className="analytics-label">Monthly Revenue</div>
                  <div className="analytics-value">€{analytics.totalRevenue.toFixed(2)}</div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-icon promo">
                  <TagIcon />
                </div>
                <div className="analytics-data">
                  <div className="analytics-label">Active Promo Codes</div>
                  <div className="analytics-value">{promoCodes.filter(p => p.active).length}</div>
                </div>
              </div>
            </div>

            {/* Recent Companies */}
            <div className="section-card">
              <h2 className="section-title">Recent Companies</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.slice(0, 10).map(company => (
                      <tr key={company.id}>
                        <td className="company-name">{company.name}</td>
                        <td>
                          <span className={`plan-badge ${company.plan || 'free'}`}>
                            {(company.plan || 'free').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${company.subscriptionStatus || 'active'}`}>
                            {company.subscriptionStatus || 'active'}
                          </span>
                        </td>
                        <td>
                          {company.createdAt
                            ? (company.createdAt?.toDate
                                ? company.createdAt.toDate().toLocaleDateString()
                                : new Date(company.createdAt).toLocaleDateString())
                            : 'N/A'}
                        </td>
                        <td>{company.userCount || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="admin-content">
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">All Companies</h2>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Owner Email</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(company => {
                      const planPrices = { starter: 10, professional: 15, enterprise: 25 };
                      const revenue = planPrices[company.plan] || 0;

                      return (
                        <tr key={company.id}>
                          <td className="company-name">{company.name}</td>
                          <td>{company.ownerEmail || 'N/A'}</td>
                          <td>
                            <span className={`plan-badge ${company.plan || 'free'}`}>
                              {(company.plan || 'free').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${company.subscriptionStatus || 'active'}`}>
                              {company.subscriptionStatus || 'active'}
                            </span>
                          </td>
                          <td>
                          {company.createdAt
                            ? (company.createdAt?.toDate
                                ? company.createdAt.toDate().toLocaleDateString()
                                : new Date(company.createdAt).toLocaleDateString())
                            : 'N/A'}
                        </td>
                          <td className="revenue">€{revenue}/mo</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Promo Codes Tab */}
        {activeTab === 'promo-codes' && (
          <div className="admin-content">
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">Promo Codes</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingPromo(null);
                    setShowPromoModal(true);
                  }}
                >
                  <PlusIcon className="btn-icon" />
                  Create Promo Code
                </button>
              </div>

              <div className="promo-grid">
                {promoCodes.map(promo => (
                  <div key={promo.id} className={`promo-card ${!promo.active ? 'inactive' : ''}`}>
                    <div className="promo-header">
                      <div className="promo-code">{promo.code}</div>
                      <div className="promo-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => {
                            setEditingPromo(promo);
                            setShowPromoModal(true);
                          }}
                          title="Edit"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeletePromo(promo.id)}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    <div className="promo-body">
                      <div className="promo-type">
                        {promo.type === 'percentage' && `${promo.discountValue}% OFF`}
                        {promo.type === 'fixed_amount' && `€${promo.discountValue} OFF`}
                        {promo.type === 'free_trial' && `${promo.discountValue} Days Free`}
                      </div>

                      <div className="promo-details">
                        <div className="detail-row">
                          <span className="detail-label">Duration:</span>
                          <span className="detail-value">{promo.duration}</span>
                        </div>
                        {promo.maxUses && (
                          <div className="detail-row">
                            <span className="detail-label">Uses:</span>
                            <span className="detail-value">{promo.usedCount}/{promo.maxUses}</span>
                          </div>
                        )}
                        {promo.expiresAt && (
                          <div className="detail-row">
                            <span className="detail-label">Expires:</span>
                            <span className="detail-value">
                              {promo.expiresAt.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        className={`toggle-active-btn ${promo.active ? 'active' : 'inactive'}`}
                        onClick={() => handleTogglePromoActive(promo)}
                      >
                        {promo.active ? (
                          <>
                            <CheckIcon className="toggle-icon" />
                            Active
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="toggle-icon" />
                            Inactive
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Promo Code Modal */}
        {showPromoModal && (
          <PromoCodeModal
            promo={editingPromo}
            onClose={() => {
              setShowPromoModal(false);
              setEditingPromo(null);
            }}
            onSave={handleSavePromoCode}
          />
        )}
      </div>
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
      ...formData,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      expiresAt: formData.expiresAt ? Timestamp.fromDate(new Date(formData.expiresAt)) : null,
      discountValue: parseFloat(formData.discountValue)
    };

    onSave(promoData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container promo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{promo ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              className="form-input"
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
              required
              min="0"
              step={formData.type === 'percentage' || formData.type === 'free_trial' ? '1' : '0.01'}
              className="form-input"
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
                min="0"
                className="form-input"
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
