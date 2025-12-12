export const locales = {
  es: {
    label: "Español",
    dayjs: () => import("dayjs/locale/es"),
    flatpickr: () =>
      import("flatpickr/dist/l10n/es").then((module) => module.Spanish),
    i18n: () => import("./locales/es/translations.json"),
    flag: "spain",
  },
};

export const supportedLanguages = Object.keys(locales);

export type LocaleCode = keyof typeof locales;

export type Dir = "ltr" | "rtl";
