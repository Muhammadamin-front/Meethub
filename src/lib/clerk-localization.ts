// Clerk ships its UI in English and we don't depend on @clerk/localizations, so
// we translate just the strings we surface (the user-button account menu) for
// ru/uz. English falls through to Clerk's defaults.

const ru = {
  userButton: {
    action__manageAccount: "Управление аккаунтом",
    action__signOut: "Выйти",
    action__addAccount: "Добавить аккаунт",
    action__signOutAll: "Выйти из всех аккаунтов",
  },
};

const uz = {
  userButton: {
    action__manageAccount: "Hisobni boshqarish",
    action__signOut: "Chiqish",
    action__addAccount: "Hisob qo‘shish",
    action__signOutAll: "Barcha hisoblardan chiqish",
  },
};

/** Partial Clerk localization for the given locale (undefined = English). */
export function clerkLocalization(locale: string) {
  if (locale === "ru") return ru;
  if (locale === "uz") return uz;
  return undefined;
}
