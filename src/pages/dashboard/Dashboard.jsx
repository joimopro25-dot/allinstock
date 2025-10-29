import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRightOnRectangleIcon,
  CubeIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const { currentUser, company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key) => getTranslation(language, key);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getPlanName = (plan) => {
    if (plan === 'small') return t('smallBusiness');
    if (plan === 'medium') return t('mediumBusiness');
    return t('largeEnterprise');
  };

  // Generate particles for background effect
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 15}s`,
    animationDuration: `${15 + Math.random() * 10}s`
  }));

  return (
    <div className="dashboard-container">
      {/* Animated particles background */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: particle.left,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration
            }}
          />
        ))}
      </div>

      {/* Header with glassmorphism */}
      <header className="dashboard-header">
        <div className="company-info">
          {company?.logo && (
            <img src={company.logo} alt="Logo" style={{ height: '40px' }} />
          )}
          <h1 className="company-name">
            {company?.name || 'AllInStock'}
          </h1>
        </div>
        
        <div className="user-info">
          <LanguageToggle />
          <span className="user-email">{currentUser?.email}</span>
          <button 
            onClick={handleLogout}
            className="btn-futuristic btn-logout"
          >
            <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px' }} />
            {t('logout')}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Welcome card with glowing border */}
        <div style={{ padding: '2rem' }}>
          <div className="welcome-card">
            <h2>
              <SparklesIcon style={{ width: '32px', height: '32px', display: 'inline', marginRight: '12px', color: '#a78bfa' }} />
              {t('welcome')}
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
              {t('welcomeMessage')}
            </p>
            <div className="plan-badge">
              {t('currentPlan')}: {getPlanName(company?.plan)}
            </div>
          </div>
        </div>

        {/* Modules grid with glowing cards */}
        <div className="modules-grid">
          {/* Stock Management - Active */}
          <div 
            className="module-card"
            onClick={() => navigate('/stock')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-glow"></div>
            <div className="module-icon">
              <CubeIcon style={{ width: '48px', height: '48px', color: '#a78bfa' }} />
            </div>
            <h3>
              📦 {t('stockManagement')}
            </h3>
            <p>{t('stockDescription')}</p>
          </div>

          {/* Clients - Coming Soon */}
          <div className="module-card disabled">
            <div className="module-icon">
              <UsersIcon style={{ width: '48px', height: '48px', color: '#64748b' }} />
            </div>
            <h3>
              👥 {t('clients')}
            </h3>
            <p>{t('clientsDescription')}</p>
          </div>

          {/* Suppliers - Coming Soon */}
          <div className="module-card disabled">
            <div className="module-icon">
              <BuildingStorefrontIcon style={{ width: '48px', height: '48px', color: '#64748b' }} />
            </div>
            <h3>
              🏭 {t('suppliers')}
            </h3>
            <p>{t('suppliersDescription')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
export { Dashboard };