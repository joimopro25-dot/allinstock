import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { getAllPlans, getPlan } from '../../config/plans';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  CheckIcon,
  XMarkIcon,
  TagIcon,
  RocketLaunchIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import {
  createMbWayPayment,
  createMultibancoPayment,
  validatePromoCode as validatePromoService,
  calculateDiscount,
  formatMultibancoReference,
  formatPhoneForMbWay,
  isValidMbWayPhone
} from '../../services/eupagoService';
import './Register.css';

const RegisterNew = () => {
  const [searchParams] = useSearchParams();
  const preSelectedPlan = searchParams.get('plan') || 'free';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    plan: preSelectedPlan,
    promoCode: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoCodeStatus, setPromoCodeStatus] = useState(null); // null, 'valid', 'invalid', 'checking'
  const [promoCodeData, setPromoCodeData] = useState(null);
  const [showPromoInput, setShowPromoInput] = useState(false);

  // Payment state
  const [step, setStep] = useState('register'); // 'register', 'payment', 'success'
  const [paymentMethod, setPaymentMethod] = useState(null); // 'mbway', 'multibanco'
  const [paymentData, setPaymentData] = useState({
    phoneNumber: '',
    entity: '',
    reference: '',
    amount: 0
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [userId, setUserId] = useState(null);

  const { signUp } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const plans = getAllPlans();

  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    // Auto-check promo code if provided in URL
    const urlPromo = searchParams.get('promo');
    if (urlPromo) {
      setFormData(prev => ({ ...prev, promoCode: urlPromo }));
      setShowPromoInput(true);
      validatePromoCode(urlPromo);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset promo code status when code changes
    if (name === 'promoCode') {
      setPromoCodeStatus(null);
      setPromoCodeData(null);
    }
  };

  const validatePromoCode = async (code) => {
    if (!code || code.trim() === '') {
      setPromoCodeStatus(null);
      setPromoCodeData(null);
      return;
    }

    setPromoCodeStatus('checking');

    try {
      const promoQuery = query(
        collection(db, 'promoCodes'),
        where('code', '==', code.toUpperCase()),
        where('active', '==', true)
      );

      const snapshot = await getDocs(promoQuery);

      if (snapshot.empty) {
        setPromoCodeStatus('invalid');
        setPromoCodeData(null);
        return;
      }

      const promoDoc = snapshot.docs[0];
      const promo = { id: promoDoc.id, ...promoDoc.data() };

      // Check if expired
      if (promo.expiresAt && promo.expiresAt.toDate() < new Date()) {
        setPromoCodeStatus('invalid');
        setPromoCodeData(null);
        return;
      }

      // Check usage limit
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        setPromoCodeStatus('invalid');
        setPromoCodeData(null);
        return;
      }

      setPromoCodeStatus('valid');
      setPromoCodeData(promo);
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoCodeStatus('invalid');
      setPromoCodeData(null);
    }
  };

  const handlePromoCodeBlur = () => {
    if (formData.promoCode) {
      validatePromoCode(formData.promoCode);
    }
  };

  const calculateDiscountedPrice = (planPrice) => {
    if (!promoCodeData || !promoCodeStatus === 'valid') return planPrice;

    if (promoCodeData.type === 'percentage') {
      return planPrice * (1 - promoCodeData.discountValue / 100);
    } else if (promoCodeData.type === 'fixed_amount') {
      return Math.max(0, planPrice - promoCodeData.discountValue);
    } else if (promoCodeData.type === 'free_trial') {
      return 0; // First period free
    }

    return planPrice;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError(language === 'pt' ? 'As passwords não coincidem' : 'Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError(language === 'pt' ? 'A password deve ter pelo menos 6 caracteres' : 'Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);

      // Create user account
      const user = await signUp(formData.email, formData.password, {
        name: formData.companyName,
        plan: formData.plan,
        promoCode: promoCodeStatus === 'valid' ? formData.promoCode : null
      });

      setUserId(user.uid);

      // If free plan, go directly to dashboard
      if (selectedPlanData.price === 0 || discountedPrice === 0) {
        navigate('/dashboard');
      } else {
        // For paid plans, proceed to payment
        setStep('payment');
      }
    } catch (error) {
      setError((language === 'pt' ? 'Erro ao criar conta: ' : 'Error creating account: ') + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMbWayPayment = async () => {
    if (!isValidMbWayPhone(paymentData.phoneNumber)) {
      setPaymentError(language === 'pt' ? 'Número de telefone inválido' : 'Invalid phone number');
      return;
    }

    try {
      setPaymentError('');
      setPaymentLoading(true);

      const result = await createMbWayPayment({
        amount: discountedPrice,
        phoneNumber: formatPhoneForMbWay(paymentData.phoneNumber),
        planId: formData.plan,
        userId: userId,
        promoCode: promoCodeStatus === 'valid' ? formData.promoCode : null
      });

      if (result.success) {
        setStep('success');
        setPaymentData(prev => ({
          ...prev,
          reference: result.reference,
          amount: result.amount
        }));
      }
    } catch (error) {
      setPaymentError(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleMultibancoPayment = async () => {
    try {
      setPaymentError('');
      setPaymentLoading(true);

      const result = await createMultibancoPayment({
        amount: discountedPrice,
        planId: formData.plan,
        userId: userId,
        promoCode: promoCodeStatus === 'valid' ? formData.promoCode : null
      });

      if (result.success) {
        setPaymentData({
          entity: result.entity,
          reference: result.reference,
          amount: result.amount
        });
        setStep('success');
      }
    } catch (error) {
      setPaymentError(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setPaymentError('');

    if (method === 'multibanco') {
      handleMultibancoPayment();
    }
  };

  const selectedPlanData = getPlan(formData.plan);
  const discountedPrice = calculateDiscountedPrice(selectedPlanData.price);

  // Payment step render
  if (step === 'payment') {
    return (
      <div className="register-page">
        <div className="register-header">
          <div className="register-logo" onClick={() => navigate('/')}>
            <RocketLaunchIcon className="logo-icon" />
            <span>AllInStock</span>
          </div>
          <LanguageToggle />
        </div>

        <div className="register-container">
          <div className="register-card payment-card">
            <button
              className="back-btn"
              onClick={() => setStep('register')}
            >
              <ArrowLeftIcon className="back-icon" />
              {language === 'pt' ? 'Voltar' : 'Back'}
            </button>

            <h1 className="register-title">
              {language === 'pt' ? 'Escolher Método de Pagamento' : 'Choose Payment Method'}
            </h1>
            <p className="register-subtitle">
              {language === 'pt'
                ? 'Selecione como deseja pagar'
                : 'Select how you want to pay'}
            </p>

            <div className="price-summary-large">
              <div className="summary-row">
                <span>{language === 'pt' ? 'Plano:' : 'Plan:'}</span>
                <span>{language === 'pt' ? selectedPlanData.namePortuguese : selectedPlanData.name}</span>
              </div>
              <div className="summary-row total">
                <span>{language === 'pt' ? 'Total:' : 'Total:'}</span>
                <span className="total-price">€{discountedPrice.toFixed(2)}</span>
              </div>
            </div>

            {paymentError && (
              <div className="error-alert">
                <XMarkIcon className="alert-icon" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="payment-methods">
              <div
                className={`payment-method-card ${paymentMethod === 'mbway' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('mbway')}
              >
                <DevicePhoneMobileIcon className="payment-icon" />
                <h3>MB WAY</h3>
                <p>{language === 'pt' ? 'Pagamento instantâneo via telemóvel' : 'Instant payment via mobile'}</p>
              </div>

              <div
                className={`payment-method-card ${paymentMethod === 'multibanco' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('multibanco')}
              >
                <BuildingLibraryIcon className="payment-icon" />
                <h3>Multibanco</h3>
                <p>{language === 'pt' ? 'Pagamento via referência MB' : 'Payment via ATM reference'}</p>
              </div>
            </div>

            {paymentMethod === 'mbway' && (
              <div className="mbway-form">
                <div className="form-group">
                  <label className="form-label">
                    {language === 'pt' ? 'Número de Telemóvel' : 'Mobile Number'}
                  </label>
                  <input
                    type="tel"
                    value={paymentData.phoneNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="form-input"
                    placeholder="912345678"
                    maxLength="9"
                  />
                  <p className="form-hint">
                    {language === 'pt'
                      ? 'Insira o número associado ao MB WAY (9 dígitos)'
                      : 'Enter the number associated with MB WAY (9 digits)'}
                  </p>
                </div>

                <button
                  onClick={handleMbWayPayment}
                  disabled={paymentLoading}
                  className="submit-btn"
                >
                  {paymentLoading ? (
                    language === 'pt' ? 'A processar...' : 'Processing...'
                  ) : (
                    <>
                      {language === 'pt' ? 'Pagar €' : 'Pay €'}{discountedPrice.toFixed(2)}
                      <CreditCardIcon className="btn-icon" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success step render
  if (step === 'success') {
    return (
      <div className="register-page">
        <div className="register-header">
          <div className="register-logo" onClick={() => navigate('/')}>
            <RocketLaunchIcon className="logo-icon" />
            <span>AllInStock</span>
          </div>
          <LanguageToggle />
        </div>

        <div className="register-container">
          <div className="register-card success-card">
            <div className="success-icon-wrapper">
              <CheckIcon className="success-icon" />
            </div>

            <h1 className="register-title">
              {paymentMethod === 'mbway'
                ? (language === 'pt' ? 'Pagamento Solicitado' : 'Payment Requested')
                : (language === 'pt' ? 'Referência Gerada' : 'Reference Generated')}
            </h1>

            {paymentMethod === 'mbway' ? (
              <div className="payment-instructions">
                <p className="register-subtitle">
                  {language === 'pt'
                    ? 'Verifique o seu telemóvel e autorize o pagamento na app MB WAY'
                    : 'Check your phone and authorize the payment in the MB WAY app'}
                </p>
                <div className="payment-details">
                  <div className="detail-row">
                    <span>{language === 'pt' ? 'Montante:' : 'Amount:'}</span>
                    <span className="amount">€{paymentData.amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="payment-instructions">
                <p className="register-subtitle">
                  {language === 'pt'
                    ? 'Use a referência abaixo para pagar via Multibanco, ATM ou Home Banking'
                    : 'Use the reference below to pay via Multibanco, ATM or Home Banking'}
                </p>
                <div className="payment-details">
                  <div className="detail-row">
                    <span>{language === 'pt' ? 'Entidade:' : 'Entity:'}</span>
                    <span className="reference-value">{paymentData.entity}</span>
                  </div>
                  <div className="detail-row">
                    <span>{language === 'pt' ? 'Referência:' : 'Reference:'}</span>
                    <span className="reference-value">{formatMultibancoReference(paymentData.reference)}</span>
                  </div>
                  <div className="detail-row">
                    <span>{language === 'pt' ? 'Montante:' : 'Amount:'}</span>
                    <span className="amount">€{paymentData.amount?.toFixed(2)}</span>
                  </div>
                </div>
                <p className="payment-note">
                  {language === 'pt'
                    ? 'A referência é válida por 24 horas. Após o pagamento, a sua subscrição será ativada automaticamente.'
                    : 'The reference is valid for 24 hours. After payment, your subscription will be activated automatically.'}
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="submit-btn"
            >
              {language === 'pt' ? 'Ir para o Dashboard' : 'Go to Dashboard'}
              <RocketLaunchIcon className="btn-icon" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-header">
        <div className="register-logo" onClick={() => navigate('/')}>
          <RocketLaunchIcon className="logo-icon" />
          <span>AllInStock</span>
        </div>
        <LanguageToggle />
      </div>

      <div className="register-container">
        <div className="register-card">
          <h1 className="register-title">
            {language === 'pt' ? 'Criar Conta' : 'Create Account'}
          </h1>
          <p className="register-subtitle">
            {language === 'pt'
              ? 'Comece a gerir o seu inventário hoje'
              : 'Start managing your inventory today'}
          </p>

          {error && (
            <div className="error-alert">
              <XMarkIcon className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            {/* Company Name */}
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Nome da Empresa' : 'Company Name'}
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder={language === 'pt' ? 'A Sua Empresa Lda.' : 'Your Company Ltd.'}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Email' : 'Email'}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="email@example.com"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Password' : 'Password'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Confirmar Password' : 'Confirm Password'}
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            {/* Plan Selection */}
            <div className="form-group">
              <label className="form-label">
                {language === 'pt' ? 'Selecionar Plano' : 'Select Plan'}
              </label>
              <div className="plan-grid">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`plan-option ${formData.plan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, plan: plan.id }))}
                  >
                    {plan.popular && (
                      <div className="plan-popular-badge">
                        {language === 'pt' ? 'Popular' : 'Popular'}
                      </div>
                    )}
                    <div className="plan-name">
                      {language === 'pt' ? plan.namePortuguese : plan.name}
                    </div>
                    <div className="plan-price">
                      {plan.price === 0 ? (
                        <span className="price-free">{language === 'pt' ? 'Grátis' : 'Free'}</span>
                      ) : (
                        <>
                          <span className="price-currency">€</span>
                          <span className="price-amount">{plan.price}</span>
                          <span className="price-period">/{language === 'pt' ? 'mês' : 'mo'}</span>
                        </>
                      )}
                    </div>
                    <ul className="plan-features">
                      {(language === 'pt' ? plan.highlights.pt : plan.highlights.en).slice(0, 3).map((feature, idx) => (
                        <li key={idx}>
                          <CheckIcon className="feature-icon" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {formData.plan === plan.id && (
                      <div className="plan-selected-indicator">
                        <CheckIcon className="check-icon" />
                        {language === 'pt' ? 'Selecionado' : 'Selected'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Code */}
            <div className="form-group">
              {!showPromoInput ? (
                <button
                  type="button"
                  className="promo-toggle-btn"
                  onClick={() => setShowPromoInput(true)}
                >
                  <TagIcon className="promo-icon" />
                  {language === 'pt' ? 'Tenho um código promocional' : 'I have a promo code'}
                </button>
              ) : (
                <div className="promo-code-input-wrapper">
                  <label className="form-label">
                    {language === 'pt' ? 'Código Promocional' : 'Promo Code'}
                  </label>
                  <div className="promo-input-group">
                    <input
                      type="text"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleChange}
                      onBlur={handlePromoCodeBlur}
                      className={`form-input promo-input ${
                        promoCodeStatus === 'valid' ? 'valid' :
                        promoCodeStatus === 'invalid' ? 'invalid' : ''
                      }`}
                      placeholder="PROMO2025"
                    />
                    {promoCodeStatus === 'checking' && (
                      <span className="promo-status checking">
                        {language === 'pt' ? 'Verificando...' : 'Checking...'}
                      </span>
                    )}
                    {promoCodeStatus === 'valid' && (
                      <span className="promo-status valid">
                        <CheckIcon className="status-icon" />
                        {language === 'pt' ? 'Válido!' : 'Valid!'}
                      </span>
                    )}
                    {promoCodeStatus === 'invalid' && (
                      <span className="promo-status invalid">
                        <XMarkIcon className="status-icon" />
                        {language === 'pt' ? 'Inválido' : 'Invalid'}
                      </span>
                    )}
                  </div>
                  {promoCodeData && promoCodeStatus === 'valid' && (
                    <div className="promo-discount-info">
                      {promoCodeData.type === 'percentage' && (
                        <p>{promoCodeData.discountValue}% {language === 'pt' ? 'desconto aplicado!' : 'discount applied!'}</p>
                      )}
                      {promoCodeData.type === 'fixed_amount' && (
                        <p>€{promoCodeData.discountValue} {language === 'pt' ? 'desconto aplicado!' : 'discount applied!'}</p>
                      )}
                      {promoCodeData.type === 'free_trial' && (
                        <p>{promoCodeData.discountValue} {language === 'pt' ? 'dias grátis!' : 'days free!'}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Price Summary */}
            {selectedPlanData.price > 0 && (
              <div className="price-summary">
                <div className="summary-row">
                  <span>{language === 'pt' ? 'Plano selecionado:' : 'Selected plan:'}</span>
                  <span>{language === 'pt' ? selectedPlanData.namePortuguese : selectedPlanData.name}</span>
                </div>
                {promoCodeStatus === 'valid' && discountedPrice !== selectedPlanData.price && (
                  <>
                    <div className="summary-row original-price">
                      <span>{language === 'pt' ? 'Preço original:' : 'Original price:'}</span>
                      <span>€{selectedPlanData.price}/{language === 'pt' ? 'mês' : 'mo'}</span>
                    </div>
                    <div className="summary-row discount">
                      <span>{language === 'pt' ? 'Desconto:' : 'Discount:'}</span>
                      <span>-€{(selectedPlanData.price - discountedPrice).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="summary-row total">
                  <span>{language === 'pt' ? 'Total:' : 'Total:'}</span>
                  <span className="total-price">€{discountedPrice.toFixed(2)}/{language === 'pt' ? 'mês' : 'mo'}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                language === 'pt' ? 'A criar conta...' : 'Creating account...'
              ) : (
                <>
                  {language === 'pt' ? 'Criar Conta' : 'Create Account'}
                  <RocketLaunchIcon className="btn-icon" />
                </>
              )}
            </button>

            <p className="login-link">
              {language === 'pt' ? 'Já tem conta?' : 'Already have an account?'}{' '}
              <Link to="/login">
                {language === 'pt' ? 'Entrar' : 'Login'}
              </Link>
            </p>
          </form>
        </div>

        {/* Features Sidebar */}
        <div className="features-sidebar">
          <h3>{language === 'pt' ? 'Porquê AllInStock?' : 'Why AllInStock?'}</h3>
          <ul className="feature-list">
            <li>
              <CheckIcon className="feature-check" />
              <div>
                <strong>{language === 'pt' ? 'Gestão Completa' : 'Complete Management'}</strong>
                <p>{language === 'pt' ? 'Stock, clientes, orçamentos e mais' : 'Stock, clients, quotes and more'}</p>
              </div>
            </li>
            <li>
              <CheckIcon className="feature-check" />
              <div>
                <strong>{language === 'pt' ? 'Multi-Localização' : 'Multi-Location'}</strong>
                <p>{language === 'pt' ? 'Rastreie stock em todos os locais' : 'Track stock across all locations'}</p>
              </div>
            </li>
            <li>
              <CheckIcon className="feature-check" />
              <div>
                <strong>{language === 'pt' ? 'Análises Avançadas' : 'Advanced Analytics'}</strong>
                <p>{language === 'pt' ? 'Insights em tempo real' : 'Real-time insights'}</p>
              </div>
            </li>
            <li>
              <CheckIcon className="feature-check" />
              <div>
                <strong>{language === 'pt' ? 'Suporte 24/7' : '24/7 Support'}</strong>
                <p>{language === 'pt' ? 'Estamos aqui para ajudar' : 'We\'re here to help'}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterNew;
export { RegisterNew };
