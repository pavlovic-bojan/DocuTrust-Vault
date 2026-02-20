/**
 * i18n – DocuTrust Vault
 * Languages: EN, ES, FR, SR_LAT, SR_CYR (matches backend preferredLanguage)
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import srLat from './locales/sr-lat.json';
import srCyr from './locales/sr-cyr.json';

// Map backend preferredLanguage to i18next language code
export const PREFERRED_TO_LOCALE: Record<string, string> = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  SR_LAT: 'sr-Latn',
  SR_CYR: 'sr-Cyrl',
};

export const LOCALE_TO_PREFERRED: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  'sr-Latn': 'SR_LAT',
  'sr-Cyrl': 'SR_CYR',
};

const LOCALE_STORAGE_KEY = 'docutrust-locale';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  'sr-Latn': { translation: srLat },
  'sr-Cyrl': { translation: srCyr },
};

const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
const initialLng = savedLocale && Object.keys(resources).includes(savedLocale) ? savedLocale : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function persistLocale(locale: string) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export default i18n;
