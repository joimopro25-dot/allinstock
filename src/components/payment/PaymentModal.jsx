import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  XMarkIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import './PaymentModal.css';

export default function PaymentModal({ isOpen, onClose, plan, amount, userId, companyId, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('multibanco'); // 'multibanco' or 'mbway'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');

  const functions = getFunctions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (paymentMethod === 'mbway') {
        // Validate phone number
        if (!phoneNumber || phoneNumber.length !== 9) {
          throw new Error('Please enter a valid 9-digit phone number');
        }

        // Call MB WAY Cloud Function
        const createMbWayPayment = httpsCallable(functions, 'createMbWayPayment');
        const result = await createMbWayPayment({
          amount,
          phoneNumber,
          planId: plan,
          userId,
          companyId
        });

        setPaymentData({
          method: 'mbway',
          reference: result.data.reference,
          amount: result.data.amount,
          paymentId: result.data.paymentId
        });

        // Poll for payment status
        pollPaymentStatus(result.data.paymentId);
      } else {
        // Call Multibanco Cloud Function
        const createMultibancoPayment = httpsCallable(functions, 'createMultibancoPayment');
        const result = await createMultibancoPayment({
          amount,
          planId: plan,
          userId,
          companyId
        });

        setPaymentData({
          method: 'multibanco',
          entity: result.data.entity,
          reference: result.data.reference,
          amount: result.data.amount,
          paymentId: result.data.paymentId
        });

        // Poll for payment status
        pollPaymentStatus(result.data.paymentId);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = (paymentId) => {
    // Poll every 5 seconds for payment confirmation
    const interval = setInterval(async () => {
      try {
        // In a real implementation, you'd check the payment status in Firestore
        // For now, we'll just show the payment instructions
        // When webhook confirms payment, Firestore will be updated
      } catch (err) {
        console.error('Error polling payment:', err);
      }
    }, 5000);

    // Clear interval after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <XMarkIcon />
        </button>

        <div className="payment-modal-header">
          <h2>Complete Payment</h2>
          <p>Upgrade to {plan} Plan - €{amount}/month</p>
        </div>

        {!paymentData ? (
          <>
            {/* Payment Method Selection */}
            <div className="payment-method-selector">
              <button
                className={`payment-method-btn ${paymentMethod === 'multibanco' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('multibanco')}
              >
                <CreditCardIcon className="method-icon" />
                <span>Multibanco</span>
              </button>
              <button
                className={`payment-method-btn ${paymentMethod === 'mbway' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('mbway')}
              >
                <DevicePhoneMobileIcon className="method-icon" />
                <span>MB WAY</span>
              </button>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="payment-form">
              {paymentMethod === 'mbway' && (
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9xxxxxxxx"
                    maxLength="9"
                    className="form-input"
                    required
                  />
                  <p className="form-hint">Enter your 9-digit Portuguese mobile number</p>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <ExclamationCircleIcon className="error-icon" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-payment-submit" disabled={loading}>
                {loading ? 'Processing...' : `Pay €${amount}`}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Payment Instructions */}
            <div className="payment-instructions">
              <CheckCircleIcon className="success-icon" />

              {paymentData.method === 'mbway' ? (
                <>
                  <h3>MB WAY Payment Initiated</h3>
                  <p className="instructions-text">
                    Check your MB WAY app on your phone to confirm the payment of <strong>€{paymentData.amount}</strong>
                  </p>
                  <div className="payment-info-box">
                    <div className="info-row">
                      <span className="info-label">Reference:</span>
                      <span className="info-value">{paymentData.reference}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Amount:</span>
                      <span className="info-value">€{paymentData.amount}</span>
                    </div>
                  </div>
                  <p className="payment-note">
                    Once confirmed in your MB WAY app, your plan will be activated automatically.
                  </p>
                </>
              ) : (
                <>
                  <h3>Multibanco Payment Reference</h3>
                  <p className="instructions-text">
                    Use this reference to pay at any ATM or online banking
                  </p>
                  <div className="payment-info-box">
                    <div className="info-row">
                      <span className="info-label">Entity:</span>
                      <span className="info-value large">{paymentData.entity}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Reference:</span>
                      <span className="info-value large">{paymentData.reference}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Amount:</span>
                      <span className="info-value large">€{paymentData.amount}</span>
                    </div>
                  </div>
                  <div className="payment-steps">
                    <h4>How to pay:</h4>
                    <ol>
                      <li>Go to any Multibanco ATM</li>
                      <li>Select "Payments" or "Pagamentos"</li>
                      <li>Enter the Entity and Reference above</li>
                      <li>Confirm the amount and complete payment</li>
                    </ol>
                  </div>
                  <p className="payment-note">
                    Your plan will be activated automatically once payment is confirmed.
                  </p>
                </>
              )}
            </div>

            <button onClick={onClose} className="btn-close-instructions">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
