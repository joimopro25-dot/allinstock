import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import './ThemeToggle.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}>
      <div className="theme-toggle-track">
        <div className={`theme-toggle-slider ${theme === 'light' ? 'slider-right' : ''}`}>
          {theme === 'dark' ? (
            <MoonIcon className="theme-icon" />
          ) : (
            <SunIcon className="theme-icon" />
          )}
        </div>
        <div className="theme-options">
          <MoonIcon className={`theme-option-icon ${theme === 'dark' ? 'active' : ''}`} />
          <SunIcon className={`theme-option-icon ${theme === 'light' ? 'active' : ''}`} />
        </div>
      </div>
    </div>
  );
}
