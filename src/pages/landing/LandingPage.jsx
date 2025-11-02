import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getAllPlans } from '../../config/plans';
import {
  CheckIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  CubeIcon,
  UsersIcon,
  MapPinIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  BoltIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch plans from Firestore (managed by admin panel) or fall back to default config
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);

        // Try to fetch plans from Firestore first
        const plansSnapshot = await getDocs(collection(db, 'plans'));

        if (!plansSnapshot.empty) {
          // Use plans from Firestore (managed by admin)
          const firestorePlans = plansSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPlans(firestorePlans);
          console.log('✅ Loaded plans from Firestore (admin-managed):', firestorePlans.length);
        } else {
          // Fall back to default plans from config
          const defaultPlans = getAllPlans();
          setPlans(defaultPlans);
          console.log('✅ Loaded default plans from config:', defaultPlans.length);
        }
      } catch (error) {
        console.error('❌ Error loading plans:', error);
        // Fall back to default plans on error
        const defaultPlans = getAllPlans();
        setPlans(defaultPlans);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const features = [
    {
      icon: CubeIcon,
      title: 'Stock Management',
      titlePt: 'Gestão de Stock',
      description: 'Complete inventory control across multiple locations',
      descriptionPt: 'Controlo completo de inventário em várias localizações'
    },
    {
      icon: UsersIcon,
      title: 'Client & Supplier Management',
      titlePt: 'Gestão de Clientes & Fornecedores',
      description: 'Manage all your business relationships in one place',
      descriptionPt: 'Gerir todas as suas relações comerciais num só lugar'
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      titlePt: 'Análises Avançadas',
      description: 'Real-time insights into your business performance',
      descriptionPt: 'Insights em tempo real sobre o desempenho do seu negócio'
    },
    {
      icon: MapPinIcon,
      title: '360° Location View',
      titlePt: 'Vista 360° de Localizações',
      description: 'Track stock across warehouses, vans, and workplaces',
      descriptionPt: 'Rastreie stock em armazéns, carrinhas e locais de trabalho'
    },
    {
      icon: EnvelopeIcon,
      title: 'Email Integration',
      titlePt: 'Integração de Email',
      description: 'Sync with Gmail and send quotes directly',
      descriptionPt: 'Sincronize com Gmail e envie orçamentos diretamente'
    },
    {
      icon: CalendarIcon,
      title: 'Calendar Integration',
      titlePt: 'Integração de Calendário',
      description: 'Manage appointments with Google Calendar',
      descriptionPt: 'Gerir compromissos com Google Calendar'
    }
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan.id);
    // Navigate to registration with selected plan
    navigate(`/register?plan=${plan.id}`);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const getPriceDisplay = (plan) => {
    const price = isAnnual ? plan.price * 10 : plan.price; // 2 months free on annual
    return price === 0 ? 'Free' : `€${price}`;
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <RocketLaunchIcon className="logo-icon" />
            <span className="logo-text">AllInStock</span>
          </div>
          <div className="nav-actions">
            <button className="nav-link" onClick={handleLogin}>
              Login
            </button>
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <BoltIcon className="badge-icon" />
            <span>Complete Stock Management Solution</span>
          </div>
          <h1 className="hero-title">
            Manage Your Entire
            <span className="gradient-text"> Inventory Business</span>
            <br />
            in One Powerful Platform
          </h1>
          <p className="hero-subtitle">
            Track stock, manage clients, create quotes, and grow your business
            with our all-in-one CRM designed for inventory management professionals.
          </p>
          <div className="hero-cta">
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>
              Start Free Trial
              <RocketLaunchIcon className="btn-icon" />
            </button>
            <button className="btn-hero-secondary" onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}>
              View Pricing
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">50+</div>
              <div className="stat-label">Active Companies</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">10K+</div>
              <div className="stat-label">Products Managed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              Everything You Need to
              <span className="gradient-text"> Manage Your Stock</span>
            </h2>
            <p className="section-subtitle">
              Powerful features designed for modern inventory businesses
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              Simple, Transparent
              <span className="gradient-text"> Pricing</span>
            </h2>
            <p className="section-subtitle">
              Choose the perfect plan for your business
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={!isAnnual ? 'active' : ''}>Monthly</span>
            <button
              className={`toggle-switch ${isAnnual ? 'annual' : ''}`}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <div className="toggle-slider"></div>
            </button>
            <span className={isAnnual ? 'active' : ''}>
              Annual
              <span className="savings-badge">Save 17%</span>
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              <p>Loading pricing plans...</p>
            </div>
          ) : (
            <div className="pricing-grid">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`pricing-card ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
                >
                  {plan.popular && (
                    <div className="popular-badge">
                      <StarIcon className="badge-star" />
                      Most Popular
                    </div>
                  )}

                  <div className="plan-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-price">
                      <span className="price-amount">{getPriceDisplay(plan)}</span>
                      {plan.price > 0 && (
                        <span className="price-period">/{isAnnual ? 'year' : 'month'}</span>
                      )}
                    </div>
                    <p className="plan-description">{plan.description.en}</p>
                  </div>

                  <ul className="plan-features">
                    {plan.highlights.en.map((highlight, index) => (
                      <li key={index} className="feature-item">
                        <CheckIcon className="check-icon" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`btn-select-plan ${plan.popular ? 'primary' : 'secondary'}`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.price === 0 ? 'Start Free' : 'Get Started'}
                    <RocketLaunchIcon className="btn-icon" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="section-container">
          <div className="trust-content">
            <ShieldCheckIcon className="trust-icon" />
            <h2 className="trust-title">Trusted by Businesses Worldwide</h2>
            <p className="trust-description">
              Your data is encrypted and secure. We comply with GDPR and industry standards.
            </p>
            <div className="trust-badges">
              <div className="trust-badge">
                <CheckIcon className="badge-icon" />
                <span>GDPR Compliant</span>
              </div>
              <div className="trust-badge">
                <CheckIcon className="badge-icon" />
                <span>SSL Encrypted</span>
              </div>
              <div className="trust-badge">
                <CheckIcon className="badge-icon" />
                <span>99.9% Uptime</span>
              </div>
              <div className="trust-badge">
                <CheckIcon className="badge-icon" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Business?</h2>
          <p className="cta-subtitle">
            Join hundreds of businesses already using AllInStock to manage their inventory
          </p>
          <button className="btn-cta" onClick={() => navigate('/register')}>
            Start Your Free Trial Today
            <RocketLaunchIcon className="btn-icon" />
          </button>
          <p className="cta-note">No credit card required • Free 14-day trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <RocketLaunchIcon className="footer-logo" />
              <span className="footer-name">AllInStock</span>
            </div>
            <div className="footer-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#" onClick={handleLogin}>Login</a>
              <a href="#" onClick={() => navigate('/register')}>Sign Up</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 AllInStock. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
