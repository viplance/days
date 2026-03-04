import * as Localization from 'expo-localization';
import i18next from 'i18next';
import 'intl-pluralrules';
import { initReactI18next } from 'react-i18next';
import { Storage } from './utils/storage';

import be from './locales/be.json';
import en from './locales/en.json';
import es from './locales/es.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

export const LANGUAGES = [
  { code: 'be', name: 'Беларуская', flag: require('../assets/flags/be.png') },
  { code: 'en', name: 'English', flag: require('../assets/flags/en.png') },
  { code: 'es', name: 'Español', flag: require('../assets/flags/es.png') },
  { code: 'ru', name: 'Русский', flag: require('../assets/flags/ru.png') },
  { code: 'uk', name: 'Українська', flag: require('../assets/flags/uk.png') },
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
  const systemLanguage = Localization.getLocales()
    .map((locale: any) => locale.languageCode)
    .find((code: any) => code && Object.keys(resources).includes(code));

  const languageToUse = savedLanguage || systemLanguage || 'en';

  i18next.use(initReactI18next).init({
    resources,
    lng: languageToUse,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

export default initI18n;
