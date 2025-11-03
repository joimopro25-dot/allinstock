import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getAllPlans } from '../../config/plans';
import './PlanManagement.css';

export default function PlanManagement() {
  const { currentUser, company } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadPlansAndSubscription();
  }, [currentUser]);

  const loadPlansAndSubscription = async () => {
    if (!currentUser) return;

    try {
      // Use default plans from config
      const defaultPlans = getAllPlans();

      // Load plans from Firestore or use defaults
      const plansSnapshot = await getDoc(doc(db, 'plans', 'pricing'));
      if (plansSnapshot.exists()) {
        setPlans(plansSnapshot.data().plans || defaultPlans);
      } else {
        setPlans(defaultPlans);
      }

      // Load current subscription
      const companyDoc = await getDoc(doc(db, 'companies', currentUser.uid));
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        setCurrentSubscription({
          plan: data.plan || 'free',
          status: data.subscriptionStatus || 'active',
          nextBillingDate: data.nextBillingDate,
          scheduledPlan: data.scheduledPlan || null,
          scheduledDate: data.scheduledDate || null
        });
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setMessage({ type: 'error', text: 'Failed to load plans' });
    }
  };

  const getPlanPrice = (planId) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.price : 0;
  };

  const getPlanFeatures = (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return [];

    // If highlights exist, use them; otherwise convert features object to array
    if (plan.highlights && plan.highlights.en) {
      return plan.highlights.en;
    }

    return [];
  };

  const isPlanUpgrade = (newPlanId) => {
    const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };
    return planHierarchy[newPlanId] > planHierarchy[currentSubscription?.plan || 'free'];
  };

  const handlePlanSelect = (planId) => {
    if (planId === currentSubscription?.plan) {
      setMessage({ type: 'info', text: 'This is your current plan' });
      return;
    }
    setSelectedPlan(planId);
    setShowConfirmModal(true);
  };

  const handleConfirmPlanChange = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    setShowConfirmModal(false);

    try {
      const isUpgrade = isPlanUpgrade(selectedPlan);

      if (selectedPlan === 'free') {
        // Downgrade to free - schedule for next billing date
        await updateDoc(doc(db, 'companies', currentUser.uid), {
          scheduledPlan: 'free',
          scheduledDate: currentSubscription.nextBillingDate,
          subscriptionStatus: 'cancelled',
          updatedAt: new Date().toISOString()
        });

        setMessage({
          type: 'success',
          text: `Your subscription will be cancelled and downgraded to Free plan on ${new Date(currentSubscription.nextBillingDate).toLocaleDateString()}. You'll keep access to all features until then.`
        });
      } else if (isUpgrade) {
        // Upgrade - redirect to payment
        await handleUpgradePayment(selectedPlan);
      } else {
        // Downgrade to paid plan - schedule for next billing date
        await updateDoc(doc(db, 'companies', currentUser.uid), {
          scheduledPlan: selectedPlan,
          scheduledDate: currentSubscription.nextBillingDate,
          updatedAt: new Date().toISOString()
        });

        setMessage({
          type: 'success',
          text: `Your plan will be changed to ${selectedPlan} on ${new Date(currentSubscription.nextBillingDate).toLocaleDateString()}. You'll keep your current features until then.`
        });
      }

      await loadPlansAndSubscription();
    } catch (error) {
      console.error('Error changing plan:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePayment = async (planId) => {
    try {
      const planPrice = getPlanPrice(planId);

      // Create payment record
      const paymentRef = await addDoc(collection(db, 'payments'), {
        companyId: currentUser.uid,
        userId: currentUser.uid,
        plan: planId,
        amount: planPrice,
        type: 'upgrade',
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Store payment intent
      sessionStorage.setItem('pendingPlanChange', JSON.stringify({
        paymentId: paymentRef.id,
        plan: planId,
        type: 'upgrade'
      }));

      // Redirect to payment page (landing page with payment selection)
      navigate('/', {
        state: {
          showPayment: true,
          plan: planId,
          isUpgrade: true
        }
      });
    } catch (error) {
      throw new Error('Failed to initiate payment: ' + error.message);
    }
  };

  const handleCancelScheduledChange = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'companies', currentUser.uid), {
        scheduledPlan: null,
        scheduledDate: null,
        subscriptionStatus: 'active',
        updatedAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: 'Scheduled plan change cancelled' });
      await loadPlansAndSubscription();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderPlanCard = (plan) => {
    const isCurrentPlan = plan.id === currentSubscription?.plan;
    const isScheduled = plan.id === currentSubscription?.scheduledPlan;
    const canSelect = !isCurrentPlan && currentSubscription?.status !== 'cancelled';

    return (
      <div
        key={plan.id}
        className={`plan-card ${isCurrentPlan ? 'current-plan' : ''} ${isScheduled ? 'scheduled-plan' : ''}`}
      >
        {plan.popular && (
          <div className="plan-badge popular">
            <SparklesIcon className="badge-icon" />
            Most Popular
          </div>
        )}

        {isCurrentPlan && (
          <div className="plan-badge current">
            <CheckIcon className="badge-icon" />
            Current Plan
          </div>
        )}

        {isScheduled && (
          <div className="plan-badge scheduled">
            <ArrowPathIcon className="badge-icon" />
            Scheduled
          </div>
        )}

        <div className="plan-header">
          <h3>{plan.name}</h3>
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
          <p className="plan-description">{plan.description?.en || plan.description || ''}</p>
        </div>

        <div className="plan-features">
          <h4>Features</h4>
          <ul>
            {(plan.highlights?.en || []).map((feature, index) => (
              <li key={index}>
                <CheckIcon className="feature-icon" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button
          className={`btn-plan-select ${isCurrentPlan ? 'disabled' : isPlanUpgrade(plan.id) ? 'upgrade' : 'downgrade'}`}
          onClick={() => handlePlanSelect(plan.id)}
          disabled={!canSelect || loading}
        >
          {isCurrentPlan ? 'Current Plan' : isPlanUpgrade(plan.id) ? 'Upgrade' : 'Downgrade'}
        </button>
      </div>
    );
  };

  return (
    <div className="plan-management">
      <div className="settings-header">
        <button onClick={() => navigate('/settings/account')} className="btn-back">
          ← Back to Settings
        </button>
        <h1>Plan Management</h1>
        <p>Upgrade or downgrade your subscription plan</p>
      </div>

      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.type === 'success' ? (
            <CheckIcon className="alert-icon" />
          ) : message.type === 'error' ? (
            <XMarkIcon className="alert-icon" />
          ) : (
            <ExclamationTriangleIcon className="alert-icon" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="current-subscription-banner">
          <div className="subscription-info">
            <h3>Current: {currentSubscription.plan.charAt(0).toUpperCase() + currentSubscription.plan.slice(1)} Plan</h3>
            <span className={`status-badge ${currentSubscription.status}`}>
              {currentSubscription.status}
            </span>
          </div>

          {currentSubscription.scheduledPlan && (
            <div className="scheduled-change-info">
              <ExclamationTriangleIcon className="info-icon" />
              <div>
                <p><strong>Scheduled Change:</strong></p>
                <p>
                  Your plan will change to <strong>{currentSubscription.scheduledPlan}</strong> on{' '}
                  {new Date(currentSubscription.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handleCancelScheduledChange}
                className="btn-cancel-schedule"
                disabled={loading}
              >
                Cancel Change
              </button>
            </div>
          )}

          {currentSubscription.status === 'cancelled' && !currentSubscription.scheduledPlan && (
            <div className="cancellation-info">
              <ExclamationTriangleIcon className="info-icon" />
              <p>
                Your subscription is cancelled. Access will end on{' '}
                {currentSubscription.nextBillingDate
                  ? new Date(currentSubscription.nextBillingDate).toLocaleDateString()
                  : 'your next billing date'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map(plan => renderPlanCard(plan))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Plan Change</h2>
            <p>
              {isPlanUpgrade(selectedPlan)
                ? `You're upgrading to the ${selectedPlan} plan. You'll be redirected to complete the payment.`
                : selectedPlan === 'free'
                ? `You're downgrading to the Free plan. Your current plan will remain active until ${currentSubscription?.nextBillingDate ? new Date(currentSubscription.nextBillingDate).toLocaleDateString() : 'your next billing date'}, then you'll be downgraded.`
                : `You're downgrading to the ${selectedPlan} plan. The change will take effect on ${currentSubscription?.nextBillingDate ? new Date(currentSubscription.nextBillingDate).toLocaleDateString() : 'your next billing date'}.`
              }
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmPlanChange} className="btn-primary" disabled={loading}>
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
