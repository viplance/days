import i18n from 'i18next';
import { LocaleConfig } from 'react-native-calendars';

export const updateCalendarLocale = (lang: string) => {
  const monthNames = i18n.t('calendar.monthNames', {
    lng: lang,
    returnObjects: true,
  }) as string[];
  const monthNamesShort = i18n.t('calendar.monthNamesShort', {
    lng: lang,
    returnObjects: true,
  }) as string[];
  const dayNames = i18n.t('calendar.dayNames', {
    lng: lang,
    returnObjects: true,
  }) as string[];
  const dayNamesShort = i18n.t('calendar.dayNamesShort', {
    lng: lang,
    returnObjects: true,
  }) as string[];
  const today = i18n.t('calendar.today', { lng: lang }) as string;

  if (Array.isArray(monthNames) && Array.isArray(dayNames)) {
    LocaleConfig.locales[lang] = {
      monthNames,
      monthNamesShort,
      dayNames,
      dayNamesShort,
      today,
    };
    LocaleConfig.defaultLocale = lang;
  } else {
    // Fallback or default
    LocaleConfig.defaultLocale = 'en';
  }
};

export const setCalendarLocale = (lang: string) => {
  updateCalendarLocale(lang);
};
