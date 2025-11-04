import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import {
  UserIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Sidebar } from '../../components/common/Sidebar';
import './AccountSettings.css';

export default function AccountSettings() {
  const { currentUser, company } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Company data
  const [companyData, setCompanyData] = useState({
    name: '',
    plan: '',
    logo: ''
  });

  // Subscription data
  const [subscriptionData, setSubscriptionData] = useState({
    plan: '',
    status: 'active',
    startDate: '',
    nextBillingDate: '',
    amount: 0
  });

  useEffect(() => {
    loadUserData();
  }, [currentUser, company]);

  const loadUserData = async () => {
    if (!currentUser) return;

    setProfileData(prev => ({
      ...prev,
      email: currentUser.email || ''
    }));

    if (company) {
      setCompanyData({
        name: company.name || '',
        plan: company.plan || '',
        logo: company.logo || ''
      });

      // Load subscription details
      const companyDoc = await getDoc(doc(db, 'companies', currentUser.uid));
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        setSubscriptionData({
          plan: data.plan || 'free',
          status: data.subscriptionStatus || 'active',
          startDate: data.createdAt || '',
          nextBillingDate: data.nextBillingDate || '',
          amount: getPlanPrice(data.plan)
        });
      }
    }
  };

  const getPlanPrice = (plan) => {
    const prices = {
      free: 0,
      starter: 10,
      professional: 15,
      enterprise: 25
    };
    return prices[plan] || 0;
  };

  const getPlanName = (plan) => {
    const names = {
      free: 'Free',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise'
    };
    return names[plan] || 'Unknown';
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Update email if changed
      if (profileData.email !== currentUser.email) {
        await updateEmail(currentUser, profileData.email);
        await updateDoc(doc(db, 'users', currentUser.uid), {
          email: profileData.email
        });
      }

      // Update password if provided
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Reauthenticate user
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          profileData.currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, profileData.newPassword);

        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateDoc(doc(db, 'companies', currentUser.uid), {
        name: companyData.name,
        logo: companyData.logo,
        updatedAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: 'Company information updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    const billingDate = subscriptionData.nextBillingDate
      ? new Date(subscriptionData.nextBillingDate).toLocaleDateString()
      : 'the end of your billing period';

    if (!window.confirm(`Are you sure you want to cancel your subscription?\n\nYou will keep access to all ${subscriptionData.plan} features until ${billingDate}.\nAfter that, you will be downgraded to the Free plan.`)) {
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'companies', currentUser.uid), {
        subscriptionStatus: 'cancelled',
        scheduledPlan: 'free',
        scheduledDate: subscriptionData.nextBillingDate,
        updatedAt: new Date().toISOString()
      });

      setSubscriptionData(prev => ({ ...prev, status: 'cancelled' }));
      setMessage({
        type: 'success',
        text: `Subscription cancelled. You will keep access to all features until ${billingDate}, then be downgraded to Free plan.`
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="account-settings">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your account, company, and subscription details</p>
        </div>

      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.type === 'success' ? (
            <CheckIcon className="alert-icon" />
          ) : (
            <XMarkIcon className="alert-icon" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <UserIcon className="tab-icon" />
          Profile
        </button>
        <button
          className={`tab-button ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          <BuildingOfficeIcon className="tab-icon" />
          Company
        </button>
        <button
          className={`tab-button ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          <CreditCardIcon className="tab-icon" />
          Subscription
        </button>
      </div>

      <div className="settings-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h2>
              <UserIcon className="section-icon" />
              Profile Information
            </h2>
            <form onSubmit={handleProfileUpdate} className="settings-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-divider">
                <h3>
                  <KeyIcon className="divider-icon" />
                  Change Password
                </h3>
              </div>

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="form-input"
                  placeholder="Enter current password to change"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="form-input"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="form-input"
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="settings-section">
            <h2>
              <BuildingOfficeIcon className="section-icon" />
              Company Information
            </h2>
            <form onSubmit={handleCompanyUpdate} className="settings-form">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Company Logo URL (Optional)</label>
                <input
                  type="url"
                  value={companyData.logo}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, logo: e.target.value }))}
                  className="form-input"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="settings-section">
            <h2>
              <CreditCardIcon className="section-icon" />
              Subscription & Billing
            </h2>

            <div className="subscription-card">
              <div className="subscription-header">
                <div>
                  <h3>{getPlanName(subscriptionData.plan)} Plan</h3>
                  <span className={`status-badge ${subscriptionData.status}`}>
                    {subscriptionData.status}
                  </span>
                </div>
                <div className="subscription-price">
                  €{subscriptionData.amount}
                  <span className="price-period">/month</span>
                </div>
              </div>

              <div className="subscription-details">
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{subscriptionData.status}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Started:</span>
                  <span className="detail-value">
                    {subscriptionData.startDate ? new Date(subscriptionData.startDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {subscriptionData.plan !== 'free' && (
                  <div className="detail-row">
                    <span className="detail-label">Next Billing:</span>
                    <span className="detail-value">
                      {subscriptionData.nextBillingDate ? new Date(subscriptionData.nextBillingDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )}
              </div>

              <div className="subscription-actions">
                {subscriptionData.plan !== 'free' && subscriptionData.status === 'active' && (
                  <button
                    className="btn-danger"
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => window.location.href = '/settings/plans'}
                  disabled={loading}
                >
                  <ArrowPathIcon className="btn-icon" />
                  Change Plan
                </button>
              </div>
            </div>

            <div className="billing-history">
              <h3>Billing History</h3>
              <p className="text-muted">No billing history available yet.</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
