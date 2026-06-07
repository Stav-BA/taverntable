import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import he from './locales/he.json';

i18next.use(initReactI18next).init({
  lng: (typeof localStorage !== 'undefined' && localStorage.getItem('taverntable-lang')) || 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    he: { translation: he },
  },
  interpolation: { escapeValue: false },
});

export default i18next;

export const changeLanguage = (lang: 'en' | 'he') => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('taverntable-lang', lang);
  }
  i18next.changeLanguage(lang);
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};
