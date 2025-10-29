import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageIcon } from '@heroicons/react/24/outline';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="language-toggle-container">
      <LanguageIcon className="language-icon" />
      <button 
        className="language-toggle"
        onClick={toggleLanguage}
        aria-label="Toggle Language"
      >
        <span className={`toggle-option ${language === 'pt' ? 'active' : ''}`}>
          PT
        </span>
        <span className={`toggle-option ${language === 'en' ? 'active' : ''}`}>
          EN
        </span>
        <div className={`toggle-slider ${language === 'en' ? 'slider-right' : ''}`}></div>
      </button>
    </div>
  );
};

export default LanguageToggle;