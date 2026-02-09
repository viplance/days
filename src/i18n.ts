import * as Localization from 'expo-localization';
import i18n from 'i18next';
import 'intl-pluralrules';
import { initReactI18next } from 'react-i18next';
import { Storage } from './utils/storage';

import be from './locales/be.json';
import en from './locales/en.json';
import es from './locales/es.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'be', name: 'Беларуская', flag: '⬜🟥⬜' }, // Custom representation if needed, using emojis here
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  be: { translation: be },
  uk: { translation: uk },
  es: { translation: es },
};

const initI18n = async () => {
  const savedLanguage = await Storage.getLanguage();
  const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

  const languageToUse = savedLanguage || (Object.keys(resources).includes(deviceLanguage) ? deviceLanguage : 'en');

  i18n.use(initReactI18next).init({
    resources,
    lng: languageToUse,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v3',
  });
};

export default initI18n;
