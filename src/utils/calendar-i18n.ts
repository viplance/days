import { t } from 'i18next';
import { LocaleConfig } from 'react-native-calendars';

export const updateCalendarLocale = (lang: string) => {
  const monthNames = t('calendar.monthNames', {
    lng: lang,
    returnObjects: true,
  }) as string[];
  const monthNamesShort = t('calendar.monthNamesShort', {
    lng: lang,
    returnObjects: true,
  }) as string[];
  const dayNames = t('calendar.dayNames', {
    lng: lang,
    returnObjects: true,
  }) as string[];
  const dayNamesShort = t('calendar.dayNamesShort', {
    lng: lang,
    returnObjects: true,
  }) as string[];
  const today = t('calendar.today', { lng: lang }) as string;

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
