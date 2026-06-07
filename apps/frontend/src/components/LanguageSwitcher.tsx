import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as 'en' | 'he';

  const toggle = () => {
    const next = currentLang === 'en' ? 'he' : 'en';
    changeLanguage(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={currentLang === 'en' ? 'Switch to Hebrew' : 'עבור לאנגלית'}
      aria-label={currentLang === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.5rem 0.85rem',
        background: 'rgba(45,27,0,0.85)',
        border: '2px solid #c9a227',
        borderRadius: '9999px',
        color: '#F4E4BC',
        fontFamily: 'Cinzel, serif',
        fontSize: '0.8rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(201,162,39,0.3)',
        backdropFilter: 'blur(4px)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 4px 20px rgba(201,162,39,0.55)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8c84a';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 2px 12px rgba(201,162,39,0.3)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9a227';
      }}
    >
      {currentLang === 'en' ? (
        <>
          <span role="img" aria-hidden="true">🇮🇱</span>
          <span>עב</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ opacity: 0.5 }}>EN</span>
        </>
      ) : (
        <>
          <span style={{ opacity: 0.5 }}>עב</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span role="img" aria-hidden="true">🇺🇸</span>
          <span>EN</span>
        </>
      )}
    </button>
  );
}
