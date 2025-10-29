import { useLanguage } from '../../contexts/LanguageContext';
import './LanguageToggle.css';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="language-toggle" onClick={toggleLanguage}>
      <span className={`lang-option ${language === 'pt' ? 'active' : ''}`}>PT</span>
      <span className={`lang-option ${language === 'en' ? 'active' : ''}`}>EN</span>
    </div>
  );
}